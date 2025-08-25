from odoo import fields, models

class BankingLoanDocument(models.Model):
    _name = 'x_banking.loan.document'
    _description = 'Banking Loan Document'

    name = fields.Char(string='Name', required=True)
    document = fields.Binary(string='Document', required=True)
    loan_application_id = fields.Many2one('x_banking.loan.application', string='Loan Application')
    document_type = fields.Selection([
        ('id_proof', 'ID Proof (Kebele ID/Passport)'),
        ('photo', 'Recent Passport-size Photograph'),
        ('salary_slips', 'Salary Slips (last 3-6 months)'),
        ('employment_certificate', 'Employment Certificate'),
        ('business_license', 'Business License'),
        ('bank_statements', 'Bank Statements (last 6-12 months)'),
        ('collateral_ownership', 'Collateral Ownership Documents'),
        ('tax_returns', 'Tax Returns'),
        ('other', 'Other'),
    ], string='Document Type', required=True)
