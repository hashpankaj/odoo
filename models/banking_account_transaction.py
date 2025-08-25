from odoo import api, fields, models

class BankingAccountTransaction(models.Model):
    _name = 'x_banking.account.transaction'
    _description = 'Banking Account Transaction'

    date = fields.Datetime(string='Date', default=fields.Datetime.now, required=True)
    amount = fields.Monetary(string='Amount', currency_field='currency_id', required=True)
    transaction_type = fields.Selection([
        ('debit', 'Debit'),
        ('credit', 'Credit'),
    ], string='Transaction Type', required=True)
    description = fields.Char(string='Description')
    account_id = fields.Many2one('x_banking.account', string='Bank Account')
    currency_id = fields.Many2one(related='account_id.currency_id', store=True)

    @api.onchange('account_id')
    def _onchange_account_id(self):
        for rec in self:
            print(f"Onchange account_id: {rec.account_id}")
            if rec.account_id:
                print(f"Account ID: {rec.account_id.id}")
            else:
                print("Account ID is not set.")
