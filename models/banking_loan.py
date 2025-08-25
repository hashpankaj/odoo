from odoo import fields, models, api

class BankingLoan(models.Model):
    _name = 'x_banking.loan'
    _description = 'Banking Loan'
    _rec_name = 'loan_type'

    loan_type = fields.Char(string='Loan Type', required=True)
    principal_amount = fields.Monetary(string='Principal Amount', currency_field='currency_id', required=True)
    interest_rate = fields.Float(string='Interest Rate (%)', required=True)
    term = fields.Integer(string='Term (Months)', required=True)
    repayment_schedule = fields.Text(string='Repayment Schedule')
    status = fields.Selection([
        ('application', 'Application'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('paid_off', 'Paid Off'),
        ('rejected', 'Rejected'),
    ], string='Status', default='application', required=True, tracking=True)
    partner_id = fields.Many2one('res.partner', string='Customer', required=True, ondelete='restrict')
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)

    collateral_type = fields.Selection([
        ('property', 'Property'),
        ('vehicle', 'Vehicle'),
        ('other', 'Other')
    ], string='Collateral Type')
    collateral_value = fields.Monetary(string='Collateral Value', currency_field='currency_id')
    disbursement_date = fields.Date(string='Disbursement Date')
    loan_application_id = fields.Many2one('x_banking.loan.application', string='Loan Application', readonly=True)

    loan_account_number = fields.Char(string='Loan Account Number')
    emi_installment_amount = fields.Monetary(string='EMI / Installment Amount', currency_field='currency_id')
    repayment_start_date = fields.Date(string='Repayment Start Date')
    next_due_date = fields.Date(string='Next Due Date')

    @api.onchange('principal_amount', 'interest_rate', 'term')
    def _onchange_loan_details(self):
        if self.principal_amount and self.interest_rate and self.term:
            # Simple interest calculation for demonstration
            # For real-world, use more complex financial formulas
            total_interest = (self.principal_amount * self.interest_rate * self.term) / 1200
            total_repayment = self.principal_amount + total_interest
            monthly_payment = total_repayment / self.term
            self.repayment_schedule = f"Total Repayment: {total_repayment:.2f} {self.currency_id.symbol}\nMonthly Payment: {monthly_payment:.2f} {self.currency_id.symbol} for {self.term} months."
        else:
            self.repayment_schedule = False

