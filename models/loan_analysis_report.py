from odoo import fields, models, tools

class LoanAnalysisReport(models.Model):
    _name = 'x_loan.analysis.report'
    _description = 'Loan Analysis Report'
    _auto = False

    loan_type = fields.Char(string='Loan Type', readonly=True)
    status = fields.Selection([
        ('application', 'Application'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('paid_off', 'Paid Off'),
        ('rejected', 'Rejected'),
    ], string='Status', readonly=True)
    principal_amount = fields.Monetary(string='Principal Amount', readonly=True)
    partner_id = fields.Many2one('res.partner', string='Customer', readonly=True)
    currency_id = fields.Many2one('res.currency', string='Currency', readonly=True)

    def init(self):
        tools.drop_view_if_exists(self.env.cr, self._table)
        self.env.cr.execute(f"""
            CREATE OR REPLACE VIEW {self._table} AS (
                SELECT
                    l.id,
                    l.loan_type,
                    l.status,
                    l.principal_amount,
                    l.partner_id,
                    l.currency_id
                FROM
                    x_banking_loan l
            )
        """)
