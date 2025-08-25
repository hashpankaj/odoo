from odoo import fields, models, api
from odoo.exceptions import ValidationError

class BankingAccount(models.Model):
    _name = 'banking.account'
    _description = 'Bank Account'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'account_number'

    account_number = fields.Char(string='Account Number', required=True, copy=False, readonly=True, 
                                default=lambda self: self.env['ir.sequence'].next_by_code('banking.account') or 'New')
    account_type = fields.Selection([
        ('savings', 'Savings'),
        ('checking', 'Checking'),
        ('current', 'Current'),
        ('fixed_deposit', 'Fixed Deposit'),
        ('investment', 'Investment'),
        ('loan', 'Loan Account')
    ], string='Account Type', required=True)
    
    balance = fields.Monetary(string='Current Balance', currency_field='currency_id', 
                             compute='_compute_balance', store=True, tracking=True)
    available_balance = fields.Monetary(string='Available Balance', currency_field='currency_id',
                                       compute='_compute_available_balance', store=True)
    minimum_balance = fields.Monetary(string='Minimum Balance', currency_field='currency_id', default=0.0)
    overdraft_limit = fields.Monetary(string='Overdraft Limit', currency_field='currency_id', default=0.0)
    
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)
    status = fields.Selection([
        ('active', 'Active'),
        ('frozen', 'Frozen'),
        ('dormant', 'Dormant'),
        ('suspended', 'Suspended'),
        ('closed', 'Closed'),
    ], string='Status', default='active', required=True, tracking=True)
    
    # Relationships
    customer_id = fields.Many2one('banking.customer', string='Customer', required=True, ondelete='restrict')
    partner_id = fields.Many2one(related='customer_id.partner_id', string='Partner', store=True)
    branch_id = fields.Many2one('banking.branch', string='Branch')
    
    # Dates
    opening_date = fields.Date(string='Opening Date', default=fields.Date.today, required=True)
    last_transaction_date = fields.Date(string='Last Transaction Date', compute='_compute_last_transaction_date')
    
    # Related Records
    transaction_ids = fields.One2many('banking.transaction', 'account_id', string='Transactions')
    card_ids = fields.One2many('banking.card', 'account_id', string='Cards')
    
    # Computed Fields
    transaction_count = fields.Integer(string='Transaction Count', compute='_compute_transaction_count')
    monthly_average_balance = fields.Monetary(string='Monthly Avg Balance', compute='_compute_monthly_average')

    _sql_constraints = [
        ('account_number_unique', 'unique(account_number)', 'Account Number must be unique!'),
        ('minimum_balance_positive', 'check(minimum_balance >= 0)', 'Minimum balance must be positive!'),
    ]

    @api.depends('transaction_ids.amount', 'transaction_ids.type')
    def _compute_balance(self):
        for account in self:
            balance = 0.0
            for transaction in account.transaction_ids:
                if transaction.type == 'credit':
                    balance += transaction.amount
                elif transaction.type == 'debit':
                    balance -= transaction.amount
            account.balance = balance

    @api.depends('balance', 'overdraft_limit')
    def _compute_available_balance(self):
        for account in self:
            account.available_balance = account.balance + account.overdraft_limit

    @api.depends('transaction_ids')
    def _compute_transaction_count(self):
        for account in self:
            account.transaction_count = len(account.transaction_ids)

    @api.depends('transaction_ids.date')
    def _compute_last_transaction_date(self):
        for account in self:
            if account.transaction_ids:
                account.last_transaction_date = max(account.transaction_ids.mapped('date'))
            else:
                account.last_transaction_date = False

    def _compute_monthly_average(self):
        # Simplified calculation - in real implementation, you'd calculate based on daily balances
        for account in self:
            account.monthly_average_balance = account.balance

    @api.constrains('balance', 'minimum_balance')
    def _check_minimum_balance(self):
        for account in self:
            if account.balance < account.minimum_balance:
                raise ValidationError(f"Account balance cannot be below minimum balance of {account.minimum_balance}")

    def action_freeze_account(self):
        self.write({'status': 'frozen'})
        self.message_post(body="Account has been frozen")

    def action_unfreeze_account(self):
        self.write({'status': 'active'})
        self.message_post(body="Account has been unfrozen")

    def action_view_transactions(self):
        return {
            'name': 'Account Transactions',
            'type': 'ir.actions.act_window',
            'res_model': 'banking.transaction',
            'view_mode': 'tree,form',
            'domain': [('account_id', '=', self.id)],
            'context': {'default_account_id': self.id}
        }