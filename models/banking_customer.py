from odoo import fields, models, api
from odoo.exceptions import ValidationError
import re

class BankingCustomer(models.Model):
    _name = 'banking.customer'
    _description = 'Banking Customer'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'display_name'

    # Core Identity
    display_name = fields.Char(string='Display Name', compute='_compute_display_name', store=True)
    partner_id = fields.Many2one('res.partner', string='Partner', required=True, ondelete='cascade')
    customer_id = fields.Char(string='Customer ID', required=True, copy=False, readonly=True, 
                             default=lambda self: self.env['ir.sequence'].next_by_code('banking.customer') or 'New')
    cif_number = fields.Char(string='CIF Number', copy=False, tracking=True)
    
    # KYC & Compliance
    kyc_status = fields.Selection([
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired')
    ], string='KYC Status', default='pending', tracking=True)
    kyc_completion_date = fields.Date(string='KYC Completion Date', tracking=True)
    kyc_expiry_date = fields.Date(string='KYC Expiry Date', tracking=True)
    risk_rating = fields.Selection([
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('very_high', 'Very High Risk')
    ], string='Risk Rating', tracking=True)
    
    # Financial Profile
    credit_score = fields.Integer(string='Credit Score', tracking=True)
    credit_limit = fields.Monetary(string='Credit Limit', currency_field='currency_id')
    monthly_income = fields.Monetary(string='Monthly Income', currency_field='currency_id')
    customer_segment = fields.Selection([
        ('retail', 'Retail'),
        ('premium', 'Premium'),
        ('private', 'Private Banking'),
        ('corporate', 'Corporate'),
        ('sme', 'SME')
    ], string='Customer Segment', tracking=True)
    
    # Relationship Management
    relationship_manager_id = fields.Many2one('res.users', string='Relationship Manager', tracking=True)
    onboarding_date = fields.Date(string='Onboarding Date', default=fields.Date.today)
    customer_since = fields.Integer(string='Customer Since (Years)', compute='_compute_customer_since')
    last_contact_date = fields.Date(string='Last Contact Date')
    
    # Status & Preferences
    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('closed', 'Closed')
    ], string='Status', default='active', tracking=True)
    communication_preference = fields.Selection([
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('sms', 'SMS'),
        ('mail', 'Mail'),
        ('digital', 'Digital Banking')
    ], string='Communication Preference')
    
    # Related Records
    account_ids = fields.One2many('banking.account', 'customer_id', string='Accounts')
    loan_ids = fields.One2many('banking.loan', 'customer_id', string='Loans')
    card_ids = fields.One2many('banking.card', 'customer_id', string='Cards')
    transaction_ids = fields.One2many('banking.transaction', 'customer_id', string='Transactions')
    
    # Computed Fields
    total_balance = fields.Monetary(string='Total Balance', compute='_compute_financial_summary', store=True)
    total_loans = fields.Monetary(string='Total Loans', compute='_compute_financial_summary', store=True)
    active_accounts_count = fields.Integer(string='Active Accounts', compute='_compute_counts')
    active_loans_count = fields.Integer(string='Active Loans', compute='_compute_counts')
    
    currency_id = fields.Many2one('res.currency', string='Currency', 
                                 default=lambda self: self.env.company.currency_id)

    @api.depends('partner_id.name', 'customer_id')
    def _compute_display_name(self):
        for record in self:
            if record.partner_id:
                record.display_name = f"{record.partner_id.name} ({record.customer_id})"
            else:
                record.display_name = record.customer_id or 'New Customer'

    @api.depends('onboarding_date')
    def _compute_customer_since(self):
        today = fields.Date.today()
        for record in self:
            if record.onboarding_date:
                delta = today - record.onboarding_date
                record.customer_since = delta.days // 365
            else:
                record.customer_since = 0

    @api.depends('account_ids.balance', 'loan_ids.outstanding_amount')
    def _compute_financial_summary(self):
        for record in self:
            record.total_balance = sum(record.account_ids.mapped('balance'))
            record.total_loans = sum(record.loan_ids.mapped('outstanding_amount'))

    @api.depends('account_ids', 'loan_ids')
    def _compute_counts(self):
        for record in self:
            record.active_accounts_count = len(record.account_ids.filtered(lambda a: a.status == 'active'))
            record.active_loans_count = len(record.loan_ids.filtered(lambda l: l.status == 'active'))

    @api.constrains('credit_score')
    def _check_credit_score(self):
        for record in self:
            if record.credit_score and not (300 <= record.credit_score <= 850):
                raise ValidationError("Credit score must be between 300 and 850.")

    @api.model
    def create(self, vals):
        if vals.get('customer_id', 'New') == 'New':
            vals['customer_id'] = self.env['ir.sequence'].next_by_code('banking.customer') or 'New'
        return super().create(vals)

    def action_update_kyc_status(self):
        return {
            'name': 'Update KYC Status',
            'type': 'ir.actions.act_window',
            'res_model': 'banking.kyc.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_customer_id': self.id}
        }