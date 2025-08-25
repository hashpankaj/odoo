from odoo import fields, models

class BankingTicket(models.Model):
    _name = 'x_banking.ticket'
    _description = 'Banking Ticket'

    name = fields.Char(string='Subject', required=True)
    description = fields.Text(string='Description')
    partner_id = fields.Many2one('res.partner', string='Customer')
    state = fields.Selection([
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ], string='State', default='new', required=True, tracking=True)
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Medium'),
        ('2', 'High'),
        ('3', 'Urgent'),
    ], string='Priority')
    user_id = fields.Many2one('res.users', string='Assigned To', default=lambda self: self.env.user)
