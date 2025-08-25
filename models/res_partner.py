from odoo import fields, models, api
from odoo.exceptions import ValidationError

class ResPartner(models.Model):
    _inherit = 'res.partner'

    kyc_status = fields.Selection([
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ], string='KYC Status', default='pending', tracking=True)
    credit_score = fields.Integer(string='Credit Score', tracking=True)
    cif_number = fields.Char(string='CIF Number', tracking=True, copy=False)

    # KYC + Regulatory Fields
    full_legal_name = fields.Char(string='Full Legal Name (as per ID)')
    mother_name = fields.Char(string="Mother's Name")
    nationality = fields.Many2one('res.country', string='Nationality')
    taxpayer_identification_number = fields.Char(string='Taxpayer Identification Number (TIN)')
    occupation = fields.Char(string='Occupation')
    employer_name = fields.Char(string='Employer Name')
    source_of_income = fields.Char(string='Source of Income')
    employment_tenure = fields.Char(string='Employment Tenure')
    existing_bank_account_details = fields.Text(string='Existing Bank Account Details')

    date_of_birth = fields.Date(string='Date of Birth')
    gender = fields.Selection([
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ], string='Gender')
    marital_status = fields.Selection([
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ], string='Marital Status')
    communication_preference = fields.Selection([
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('mail', 'Mail'),
    ], string='Communication Preference')
    consent_gdpr = fields.Boolean(string='GDPR Consent')
    marketing_segment = fields.Selection([
        ('high_value', 'High Value'),
        ('medium_value', 'Medium Value'),
        ('low_value', 'Low Value'),
        ('new_customer', 'New Customer'),
    ], string='Marketing Segment', tracking=True)

    linkedin_profile = fields.Char(string='LinkedIn Profile')
    twitter_profile = fields.Char(string='Twitter Profile')
    facebook_profile = fields.Char(string='Facebook Profile')

    bank_account_ids = fields.One2many('x_banking.account', 'partner_id', string='Bank Accounts')
    loan_ids = fields.One2many('x_banking.loan', 'partner_id', string='Loans')
    ticket_ids = fields.One2many('x_banking.ticket', 'partner_id', string='Tickets')

    total_loan_amount = fields.Monetary(string='Total Loan Amount', compute='_compute_dashboard_data')
    total_account_balance = fields.Monetary(string='Total Account Balance', compute='_compute_dashboard_data')
    active_loans = fields.Integer(string='Active Loans', compute='_compute_dashboard_data')
    open_tickets = fields.Integer(string='Open Tickets', compute='_compute_dashboard_data')
    dashboard_html = fields.Html(string="Dashboard", compute='_compute_dashboard_html')

    @api.depends('loan_ids', 'bank_account_ids', 'ticket_ids')
    def _compute_dashboard_data(self):
        for partner in self:
            partner.total_loan_amount = sum(partner.loan_ids.mapped('principal_amount'))
            partner.total_account_balance = sum(partner.bank_account_ids.mapped('balance'))
            partner.active_loans = len(partner.loan_ids.filtered(lambda l: l.status == 'active'))
            partner.open_tickets = len(partner.ticket_ids.filtered(lambda t: t.state in ['new', 'in_progress']))

    @api.depends('total_loan_amount', 'total_account_balance', 'active_loans', 'open_tickets')
    def _compute_dashboard_html(self):
        for partner in self:
            partner.dashboard_html = self.env['ir.ui.view']._render_template('odoo_banking_crm.banking_dashboard', {
                'partner': partner,
                'total_loan_amount': partner.total_loan_amount,
                'total_account_balance': partner.total_account_balance,
                'active_loans': partner.active_loans,
                'open_tickets': partner.open_tickets,
                'ticket_ids': partner.ticket_ids,
            })

    @api.constrains('date_of_birth')
    def _check_date_of_birth(self):
        for record in self:
            if record.date_of_birth and record.date_of_birth > fields.Date.today():
                raise ValidationError("Date of birth cannot be in the future.")
