from odoo import fields, models, api

class BankingLoanApplication(models.Model):
    _name = 'x_banking.loan.application'
    _description = 'Banking Loan Application'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'application_number'

    application_number = fields.Char(string='Application Number', required=True, copy=False, readonly=True, default=lambda self: self.env['ir.sequence'].next_by_code('x_banking.loan.application') or 'New')
    partner_id = fields.Many2one('res.partner', string='Applicant', required=True, tracking=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('initial_screening', 'Initial Screening'),
        ('financial_assessment', 'Financial Assessment'),
        ('collateral_assessment', 'Collateral Assessment'),
        ('credit_scoring', 'Credit Scoring'),
        ('internal_approvals', 'Internal Approvals'),
        ('approved', 'Approved'),
        ('sanctioned', 'Sanctioned'),
        ('disbursed', 'Disbursed'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ], string='Status', default='draft', tracking=True)

    # Loan Application Details
    loan_type = fields.Selection([
        ('retail', 'Retail'),
        ('sme', 'SME'),
        ('corporate', 'Corporate'),
        ('agriculture', 'Agriculture'),
    ], string='Loan Type', required=True)
    loan_product = fields.Char(string='Loan Product', required=True)
    requested_amount = fields.Monetary(string='Requested Amount (ETB)', currency_field='currency_id', required=True)
    tenure = fields.Integer(string='Tenure (in months)', required=True)
    repayment_frequency = fields.Selection([
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('seasonal', 'Seasonal'),
    ], string='Repayment Frequency')
    proposed_collateral_type = fields.Selection([
        ('immovable_property', 'Immovable Property'),
        ('vehicle', 'Vehicle'),
        ('cash_deposit', 'Cash Deposit'),
        ('guarantee', 'Guarantee'),
        ('agricultural_land', 'Agricultural Land'),
        ('other', 'Other'),
    ], string='Proposed Collateral Type')
    collateral_valuation = fields.Monetary(string='Collateral Valuation', currency_field='currency_id')
    repayment_source = fields.Selection([
        ('salary_deduction', 'Salary Deduction'),
        ('business_income', 'Business Income'),
        ('other', 'Other'),
    ], string='Repayment Source')

    # Supporting Documents
    supporting_document_ids = fields.One2many('x_banking.loan.document', 'loan_application_id', string='Supporting Documents')
    guarantor_ids = fields.One2many('x_banking.guarantor', 'loan_application_id', string='Guarantors')

    # Financial Assessment Fields
    monthly_net_income = fields.Monetary(string='Monthly Net Income', currency_field='currency_id')
    existing_loan_repayments = fields.Monetary(string='Existing Loan Repayments', currency_field='currency_id')
    other_household_expenses = fields.Monetary(string='Other Household Expenses', currency_field='currency_id')
    total_disposable_income = fields.Monetary(string='Total Disposable Income', compute='_compute_disposable_income', store=True, currency_field='currency_id')
    recommended_eligible_loan_amount = fields.Monetary(string='Recommended Eligible Loan Amount', currency_field='currency_id')

    # Financial Ratios
    debt_to_income_ratio = fields.Float(string='Debt-to-Income Ratio (DTI%)', compute='_compute_financial_ratios', store=True)
    debt_service_ratio = fields.Float(string='Debt Service Ratio (DSR%)', compute='_compute_financial_ratios', store=True)
    loan_to_value_ratio = fields.Float(string='Loan-to-Value Ratio (LTV%)', compute='_compute_financial_ratios', store=True)

    # Approval / Sanction Fields
    approved_loan_amount = fields.Monetary(string='Approved Loan Amount', currency_field='currency_id')
    approved_tenure = fields.Integer(string='Approved Tenure (in months)')
    interest_rate = fields.Float(string='Interest Rate (%)')
    interest_type = fields.Selection([
        ('fixed', 'Fixed'),
        ('floating', 'Floating'),
    ], string='Interest Type')
    repayment_schedule_generated = fields.Text(string='Repayment Schedule Generated')
    conditions_precedent_ids = fields.One2many('x_banking.conditions.precedent', 'loan_application_id', string='Conditions Precedent')

    # Disbursement Fields
    loan_account_number = fields.Char(string='Loan Account Number')
    disbursement_date = fields.Date(string='Disbursement Date')
    disbursement_amount = fields.Monetary(string='Disbursement Amount', currency_field='currency_id')
    repayment_start_date = fields.Date(string='Repayment Start Date')
    emi_installment_amount = fields.Monetary(string='EMI / Installment Amount', currency_field='currency_id')
    next_due_date = fields.Date(string='Next Due Date')

    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)

    @api.depends('monthly_net_income', 'existing_loan_repayments', 'other_household_expenses')
    def _compute_disposable_income(self):
        for rec in self:
            rec.total_disposable_income = rec.monthly_net_income - rec.existing_loan_repayments - rec.other_household_expenses

    @api.depends('monthly_net_income', 'existing_loan_repayments', 'requested_amount', 'collateral_valuation')
    def _compute_financial_ratios(self):
        for rec in self:
            # DTI: (Existing Loan Repayments + New Loan Payment) / Monthly Net Income
            # Assuming a simplified new loan payment for demo purposes
            new_loan_payment = rec.requested_amount * 0.01 # Example: 1% of requested amount
            if rec.monthly_net_income > 0:
                rec.debt_to_income_ratio = ((rec.existing_loan_repayments + new_loan_payment) / rec.monthly_net_income) * 100
            else:
                rec.debt_to_income_ratio = 0.0

            # DSR: (Existing Loan Repayments + New Loan Payment) / Total Disposable Income
            if rec.total_disposable_income > 0:
                rec.debt_service_ratio = ((rec.existing_loan_repayments + new_loan_payment) / rec.total_disposable_income) * 100
            else:
                rec.debt_service_ratio = 0.0

            # LTV: Requested Loan Amount / Collateral Valuation
            if rec.collateral_valuation > 0:
                rec.loan_to_value_ratio = (rec.requested_loan_amount / rec.collateral_valuation) * 100
            else:
                rec.loan_to_value_ratio = 0.0

    # Sequence for Application Number
    @api.model
    def create(self, vals):
        if vals.get('application_number', 'New') == 'New':
            vals['application_number'] = self.env['ir.sequence'].next_by_code('x_banking.loan.application') or 'New'
        return super(BankingLoanApplication, self).create(vals)

    def action_submit_application(self):
        for rec in self:
            rec.state = 'submitted'

    def action_initial_screening(self):
        for rec in self:
            rec.state = 'initial_screening'

    def action_financial_assessment(self):
        for rec in self:
            rec.state = 'financial_assessment'

    def action_collateral_assessment(self):
        for rec in self:
            rec.state = 'collateral_assessment'

    def action_credit_scoring(self):
        for rec in self:
            rec.state = 'credit_scoring'

    def action_internal_approvals(self):
        for rec in self:
            rec.state = 'internal_approvals'

    def action_approve(self):
        for rec in self:
            rec.state = 'approved'

    def action_sanction(self):
        for rec in self:
            rec.state = 'sanctioned'

    def action_disburse(self):
        for rec in self:
            # Check if all Conditions Precedent are met
            if rec.conditions_precedent_ids and not all(cp.is_met for cp in rec.conditions_precedent_ids):
                raise UserError("All Conditions Precedent must be met before disbursement.")

            # Create a new x_banking.loan record
            self.env['x_banking.loan'].create({
                'loan_type': rec.loan_product, # Using loan_product as loan_type for simplicity
                'principal_amount': rec.approved_loan_amount or rec.requested_amount,
                'interest_rate': rec.interest_rate,
                'term': rec.approved_tenure or rec.tenure,
                'status': 'active',
                'partner_id': rec.partner_id.id,
                'currency_id': rec.currency_id.id,
                'collateral_type': rec.proposed_collateral_type,
                'collateral_value': rec.collateral_valuation,
                'disbursement_date': rec.disbursement_date,
                'loan_application_id': rec.id,
                'loan_account_number': rec.loan_account_number,
                'emi_installment_amount': rec.emi_installment_amount,
                'repayment_start_date': rec.repayment_start_date,
                'next_due_date': rec.next_due_date,
            })
            rec.state = 'disbursed'

    def action_reject(self):
        for rec in self:
            rec.state = 'rejected'

    def action_cancel(self):
        for rec in self:
            rec.state = 'cancelled'
