from odoo import fields, models, api
from odoo.exceptions import ValidationError

class BankingTransaction(models.Model):
    _name = 'banking.transaction'
    _description = 'Banking Transaction'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date desc, id desc'
    _rec_name = 'reference'

    # Core Transaction Details
    reference = fields.Char(string='Reference', required=True, copy=False, readonly=True,
                           default=lambda self: self.env['ir.sequence'].next_by_code('banking.transaction') or 'New')
    date = fields.Datetime(string='Transaction Date', default=fields.Datetime.now, required=True)
    value_date = fields.Date(string='Value Date', default=fields.Date.today, required=True)
    
    # Transaction Classification
    type = fields.Selection([
        ('credit', 'Credit'),
        ('debit', 'Debit')
    ], string='Type', required=True)
    category = fields.Selection([
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer_in', 'Transfer In'),
        ('transfer_out', 'Transfer Out'),
        ('fee', 'Fee'),
        ('interest', 'Interest'),
        ('loan_disbursement', 'Loan Disbursement'),
        ('loan_repayment', 'Loan Repayment'),
        ('card_payment', 'Card Payment'),
        ('other', 'Other')
    ], string='Category', required=True)
    
    # Financial Details
    amount = fields.Monetary(string='Amount', currency_field='currency_id', required=True)
    balance_after = fields.Monetary(string='Balance After', currency_field='currency_id')
    currency_id = fields.Many2one(related='account_id.currency_id', store=True)
    
    # Description & Details
    description = fields.Char(string='Description', required=True)
    narration = fields.Text(string='Narration')
    
    # Relationships
    account_id = fields.Many2one('banking.account', string='Account', required=True, ondelete='cascade')
    customer_id = fields.Many2one(related='account_id.customer_id', string='Customer', store=True)
    partner_id = fields.Many2one(related='account_id.partner_id', string='Partner', store=True)
    
    # Transaction Processing
    status = fields.Selection([
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='completed', tracking=True)
    
    # External References
    external_reference = fields.Char(string='External Reference')
    channel = fields.Selection([
        ('branch', 'Branch'),
        ('atm', 'ATM'),
        ('online', 'Online Banking'),
        ('mobile', 'Mobile Banking'),
        ('pos', 'POS'),
        ('system', 'System Generated')
    ], string='Channel')
    
    # Counterparty Information
    counterparty_account = fields.Char(string='Counterparty Account')
    counterparty_name = fields.Char(string='Counterparty Name')
    counterparty_bank = fields.Char(string='Counterparty Bank')

    _sql_constraints = [
        ('amount_positive', 'check(amount > 0)', 'Transaction amount must be positive!'),
    ]

    @api.model
    def create(self, vals):
        if vals.get('reference', 'New') == 'New':
            vals['reference'] = self.env['ir.sequence'].next_by_code('banking.transaction') or 'New'
        
        # Calculate balance after transaction
        account = self.env['banking.account'].browse(vals.get('account_id'))
        if account:
            current_balance = account.balance
            if vals.get('type') == 'credit':
                vals['balance_after'] = current_balance + vals.get('amount', 0)
            else:
                vals['balance_after'] = current_balance - vals.get('amount', 0)
        
        return super().create(vals)

    @api.constrains('amount', 'type', 'account_id')
    def _check_sufficient_balance(self):
        for transaction in self:
            if transaction.type == 'debit' and transaction.status == 'completed':
                available_balance = transaction.account_id.available_balance
                if transaction.amount > available_balance:
                    raise ValidationError(f"Insufficient balance. Available: {available_balance}, Required: {transaction.amount}")

    def action_process_transaction(self):
        self.write({'status': 'processing'})
        # Add processing logic here
        self.write({'status': 'completed'})
        self.message_post(body=f"Transaction {self.reference} processed successfully")

    def action_cancel_transaction(self):
        if self.status == 'completed':
            raise ValidationError("Cannot cancel a completed transaction")
        self.write({'status': 'cancelled'})
        self.message_post(body=f"Transaction {self.reference} cancelled")