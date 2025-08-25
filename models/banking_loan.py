from odoo import fields, models, api
from odoo.exceptions import ValidationError
from datetime import datetime, timedelta

class BankingLoan(models.Model):
    _name = 'banking.loan'
    _description = 'Banking Loan'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'loan_number'

    # Core Loan Information
    loan_number = fields.Char(string='Loan Number', required=True, copy=False, readonly=True,
                             default=lambda self: self.env['ir.sequence'].next_by_code('banking.loan') or 'New')
    loan_product_id = fields.Many2one('banking.loan.product', string='Loan Product', required=True)
    loan_type = fields.Selection(related='loan_product_id.loan_type', string='Loan Type', store=True)
    
    # Financial Details
    principal_amount = fields.Monetary(string='Principal Amount', currency_field='currency_id', required=True)
    outstanding_amount = fields.Monetary(string='Outstanding Amount', currency_field='currency_id', 
                                        compute='_compute_outstanding_amount', store=True)
    disbursed_amount = fields.Monetary(string='Disbursed Amount', currency_field='currency_id')
    interest_rate = fields.Float(string='Interest Rate (%)', required=True)
    effective_rate = fields.Float(string='Effective Rate (%)', compute='_compute_effective_rate')
    
    # Term & Repayment
    term_months = fields.Integer(string='Term (Months)', required=True)
    repayment_frequency = fields.Selection([
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('semi_annual', 'Semi-Annual'),
        ('annual', 'Annual')
    ], string='Repayment Frequency', default='monthly', required=True)
    emi_amount = fields.Monetary(string='EMI Amount', currency_field='currency_id', 
                                compute='_compute_emi_amount', store=True)
    
    # Status & Lifecycle
    status = fields.Selection([
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('active', 'Active'),
        ('overdue', 'Overdue'),
        ('restructured', 'Restructured'),
        ('paid_off', 'Paid Off'),
        ('written_off', 'Written Off'),
        ('closed', 'Closed')
    ], string='Status', default='draft', required=True, tracking=True)
    
    # Relationships
    customer_id = fields.Many2one('banking.customer', string='Customer', required=True, ondelete='restrict')
    partner_id = fields.Many2one(related='customer_id.partner_id', string='Partner', store=True)
    loan_officer_id = fields.Many2one('res.users', string='Loan Officer', tracking=True)
    branch_id = fields.Many2one('banking.branch', string='Branch')
    
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)

    # Important Dates
    application_date = fields.Date(string='Application Date', default=fields.Date.today)
    approval_date = fields.Date(string='Approval Date', tracking=True)
    disbursement_date = fields.Date(string='Disbursement Date')
    first_payment_date = fields.Date(string='First Payment Date')
    maturity_date = fields.Date(string='Maturity Date', compute='_compute_maturity_date', store=True)
    next_payment_date = fields.Date(string='Next Payment Date')
    
    # Collateral & Security
    collateral_ids = fields.One2many('banking.loan.collateral', 'loan_id', string='Collateral')
    total_collateral_value = fields.Monetary(string='Total Collateral Value', 
                                           compute='_compute_total_collateral_value')
    ltv_ratio = fields.Float(string='LTV Ratio (%)', compute='_compute_ltv_ratio')
    
    # Performance Metrics
    days_overdue = fields.Integer(string='Days Overdue', compute='_compute_days_overdue')
    total_paid = fields.Monetary(string='Total Paid', compute='_compute_payment_summary')
    remaining_payments = fields.Integer(string='Remaining Payments', compute='_compute_remaining_payments')
    
    # Related Records
    payment_ids = fields.One2many('banking.loan.payment', 'loan_id', string='Payments')
    schedule_ids = fields.One2many('banking.loan.schedule', 'loan_id', string='Repayment Schedule')

    _sql_constraints = [
        ('loan_number_unique', 'unique(loan_number)', 'Loan number must be unique!'),
        ('principal_positive', 'check(principal_amount > 0)', 'Principal amount must be positive!'),
        ('interest_rate_positive', 'check(interest_rate >= 0)', 'Interest rate must be non-negative!'),
        ('term_positive', 'check(term_months > 0)', 'Term must be positive!'),
    ]

    @api.depends('principal_amount', 'payment_ids.amount')
    def _compute_outstanding_amount(self):
        for loan in self:
            total_paid = sum(loan.payment_ids.filtered(lambda p: p.status == 'completed').mapped('amount'))
            loan.outstanding_amount = loan.principal_amount - total_paid

    @api.depends('principal_amount', 'interest_rate', 'term_months', 'repayment_frequency')
    def _compute_emi_amount(self):
        for loan in self:
            if loan.principal_amount and loan.interest_rate and loan.term_months:
                # Calculate EMI using standard formula
                monthly_rate = loan.interest_rate / (12 * 100)
                if monthly_rate > 0:
                    emi = (loan.principal_amount * monthly_rate * (1 + monthly_rate) ** loan.term_months) / \
                          ((1 + monthly_rate) ** loan.term_months - 1)
                    loan.emi_amount = emi
                else:
                    loan.emi_amount = loan.principal_amount / loan.term_months
            else:
                loan.emi_amount = 0

    @api.depends('disbursement_date', 'term_months')
    def _compute_maturity_date(self):
        for loan in self:
            if loan.disbursement_date and loan.term_months:
                loan.maturity_date = loan.disbursement_date + timedelta(days=loan.term_months * 30)
            else:
                loan.maturity_date = False

    @api.depends('collateral_ids.value')
    def _compute_total_collateral_value(self):
        for loan in self:
            loan.total_collateral_value = sum(loan.collateral_ids.mapped('value'))

    @api.depends('principal_amount', 'total_collateral_value')
    def _compute_ltv_ratio(self):
        for loan in self:
            if loan.total_collateral_value > 0:
                loan.ltv_ratio = (loan.principal_amount / loan.total_collateral_value) * 100
            else:
                loan.ltv_ratio = 0

    @api.depends('next_payment_date')
    def _compute_days_overdue(self):
        today = fields.Date.today()
        for loan in self:
            if loan.next_payment_date and loan.next_payment_date < today:
                loan.days_overdue = (today - loan.next_payment_date).days
            else:
                loan.days_overdue = 0

    @api.depends('payment_ids.amount')
    def _compute_payment_summary(self):
        for loan in self:
            loan.total_paid = sum(loan.payment_ids.filtered(lambda p: p.status == 'completed').mapped('amount'))

    @api.depends('term_months', 'payment_ids')
    def _compute_remaining_payments(self):
        for loan in self:
            completed_payments = len(loan.payment_ids.filtered(lambda p: p.status == 'completed'))
            loan.remaining_payments = max(0, loan.term_months - completed_payments)

    def _compute_effective_rate(self):
        for loan in self:
            # Simplified effective rate calculation
            loan.effective_rate = loan.interest_rate

    @api.model
    def create(self, vals):
        if vals.get('loan_number', 'New') == 'New':
            vals['loan_number'] = self.env['ir.sequence'].next_by_code('banking.loan') or 'New'
        return super().create(vals)

    def action_approve(self):
        self.write({
            'status': 'approved',
            'approval_date': fields.Date.today()
        })
        self.message_post(body="Loan approved")

    def action_disburse(self):
        if self.status != 'approved':
            raise ValidationError("Only approved loans can be disbursed")
        
        self.write({
            'status': 'disbursed',
            'disbursement_date': fields.Date.today(),
            'disbursed_amount': self.principal_amount
        })
        
        # Generate repayment schedule
        self._generate_repayment_schedule()
        self.message_post(body="Loan disbursed successfully")

    def _generate_repayment_schedule(self):
        """Generate loan repayment schedule"""
        self.schedule_ids.unlink()  # Clear existing schedule
        
        payment_date = self.first_payment_date or self.disbursement_date
        outstanding = self.principal_amount
        
        for i in range(self.term_months):
            interest_amount = outstanding * (self.interest_rate / 100 / 12)
            principal_amount = self.emi_amount - interest_amount
            outstanding -= principal_amount
            
            self.env['banking.loan.schedule'].create({
                'loan_id': self.id,
                'installment_number': i + 1,
                'due_date': payment_date,
                'principal_amount': principal_amount,
                'interest_amount': interest_amount,
                'total_amount': self.emi_amount,
                'outstanding_balance': max(0, outstanding)
            })
            
            # Move to next payment date
            payment_date = payment_date + timedelta(days=30)  # Simplified monthly increment

    def action_view_payments(self):
        return {
            'name': 'Loan Payments',
            'type': 'ir.actions.act_window',
            'res_model': 'banking.loan.payment',
            'view_mode': 'tree,form',
            'domain': [('loan_id', '=', self.id)],
            'context': {'default_loan_id': self.id}
        }