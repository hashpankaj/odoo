from odoo import fields, models, api

class BankingAccount(models.Model):
    _name = 'x_banking.account'
    _description = 'Bank Account'
    _rec_name = 'account_number'

    account_number = fields.Char(string='Account Number', required=True, copy=False, readonly=True, default=lambda self: self.env['ir.sequence'].next_by_code('x_banking.account') or 'New')
    account_type = fields.Selection([
        ('savings', 'Savings'),
        ('checking', 'Checking'),
        ('current', 'Current'),
        ('fixed_deposit', 'Fixed Deposit'),
    ], string='Account Type', required=True)
    balance = fields.Monetary(string='Balance', currency_field='currency_id', compute='_compute_balance', store=True)
    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)
    status = fields.Selection([
        ('active', 'Active'),
        ('dormant', 'Dormant'),
        ('closed', 'Closed'),
    ], string='Status', default='active', required=True)
    partner_id = fields.Many2one('res.partner', string='Customer', required=True, ondelete='restrict')
    transaction_ids = fields.One2many('x_banking.account.transaction', 'account_id', string='Transactions')
    card_ids = fields.One2many(
        'banking.card',
        'account_id',
        string='Cards'
    )

    _sql_constraints = [
        ('account_number_unique', 'unique(account_number)', 'Account Number must be unique!'),
    ]

    @api.depends('transaction_ids.amount', 'transaction_ids.transaction_type')
    def _compute_balance(self):
        for account in self:
            balance = 0.0
            for transaction in account.transaction_ids:
                if transaction.transaction_type == 'credit':
                    balance += transaction.amount
                elif transaction.transaction_type == 'debit':
                    balance -= transaction.amount
            account.balance = balance
