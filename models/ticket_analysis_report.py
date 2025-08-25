from odoo import fields, models, tools

class TicketAnalysisReport(models.Model):
    _name = 'x_ticket.analysis.report'
    _description = 'Ticket Analysis Report'
    _auto = False

    state = fields.Selection([
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ], string='State', readonly=True)
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Medium'),
        ('2', 'High'),
        ('3', 'Urgent'),
    ], string='Priority', readonly=True)
    partner_id = fields.Many2one('res.partner', string='Customer', readonly=True)
    user_id = fields.Many2one('res.users', string='Assigned To', readonly=True)

    def init(self):
        tools.drop_view_if_exists(self.env.cr, self._table)
        self.env.cr.execute(f"""
            CREATE OR REPLACE VIEW {self._table} AS (
                SELECT
                    t.id,
                    t.state,
                    t.priority,
                    t.partner_id,
                    t.user_id
                FROM
                    x_banking_ticket t
            )
        """)
