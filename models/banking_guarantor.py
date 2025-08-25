from odoo import fields, models

class BankingGuarantor(models.Model):
    _name = 'x_banking.guarantor'
    _description = 'Banking Guarantor'

    name = fields.Char(string='Name', required=True)
    identification_number = fields.Char(string='ID Number')
    income_source = fields.Char(string='Income Source')
    relationship_with_applicant = fields.Char(string='Relationship with Applicant')
    loan_application_id = fields.Many2one('x_banking.loan.application', string='Loan Application')
