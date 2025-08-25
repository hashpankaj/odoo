from odoo import fields, models

class BankingConditionsPrecedent(models.Model):
    _name = 'x_banking.conditions.precedent'
    _description = 'Banking Conditions Precedent'

    name = fields.Char(string='Condition', required=True)
    is_met = fields.Boolean(string='Met', default=False)
    loan_application_id = fields.Many2one('x_banking.loan.application', string='Loan Application')
