from odoo import api, fields, models

class BankingOverallDashboard(models.Model):
    _name = 'x_banking.overall.dashboard'
    _description = 'Banking Overall Dashboard'

    name = fields.Char(default="Dashboard")

    # CRM/Leads
    total_leads = fields.Integer(string='Total Leads', compute='_compute_dashboard_data')
    leads_new = fields.Integer(string='New Leads', compute='_compute_dashboard_data')
    leads_qualified = fields.Integer(string='Qualified Leads', compute='_compute_dashboard_data')
    leads_won = fields.Integer(string='Won Leads', compute='_compute_dashboard_data')

    # Customers
    total_customers = fields.Integer(string='Total Customers', compute='_compute_dashboard_data')
    customers_kyc_verified = fields.Integer(string='KYC Verified Customers', compute='_compute_dashboard_data')

    # Bank Accounts
    total_bank_accounts = fields.Integer(string='Total Bank Accounts', compute='_compute_dashboard_data')
    total_balance_accounts = fields.Monetary(string='Total Account Balance', compute='_compute_dashboard_data')

    # Loans
    total_loans = fields.Integer(string='Total Loans', compute='_compute_dashboard_data')
    loans_active = fields.Integer(string='Active Loans', compute='_compute_dashboard_data')
    total_principal_amount = fields.Monetary(string='Total Principal Loan Amount', compute='_compute_dashboard_data')

    # Loan Applications
    total_loan_applications = fields.Integer(string='Total Loan Applications', compute='_compute_dashboard_data')
    applications_submitted = fields.Integer(string='Submitted Applications', compute='_compute_dashboard_data')
    applications_approved = fields.Integer(string='Approved Applications', compute='_compute_dashboard_data')

    # Tickets
    total_tickets = fields.Integer(string='Total Tickets', compute='_compute_dashboard_data')
    tickets_open = fields.Integer(string='Open Tickets', compute='_compute_dashboard_data')

    currency_id = fields.Many2one('res.currency', string='Currency', default=lambda self: self.env.company.currency_id)

    def _compute_dashboard_data(self):
        for record in self:
            # CRM/Leads
            record.total_leads = self.env['crm.lead'].search_count([])
            stage_new = self.env['crm.stage'].search([('name', 'ilike', 'New')], limit=1)
            record.leads_new = self.env['crm.lead'].search_count([('stage_id', '=', stage_new.id)])
            stage_qualified = self.env['crm.stage'].search([('name', 'ilike', 'Qualified')], limit=1)
            record.leads_qualified = self.env['crm.lead'].search_count([('stage_id', '=', stage_qualified.id)])
            stage_won = self.env['crm.stage'].search([('name', 'ilike', 'Won')], limit=1)
            record.leads_won = self.env['crm.lead'].search_count([('stage_id', '=', stage_won.id)])

            # Customers
            record.total_customers = self.env['res.partner'].search_count([('user_ids', '=', False)])
            record.customers_kyc_verified = self.env['res.partner'].search_count([('kyc_status', '=', 'verified')])

            # Bank Accounts
            record.total_bank_accounts = self.env['x_banking.account'].search_count([])
            balance_data = self.env['x_banking.account'].read_group([], ['balance'], [])
            current_balance = balance_data[0]['balance'] if balance_data and balance_data[0]['balance'] else 0

            # Loans
            record.total_loans = self.env['x_banking.loan'].search_count([])
            record.loans_active = self.env['x_banking.loan'].search_count([('status', '=', 'active')])
            principal_data = self.env['x_banking.loan'].read_group([], ['principal_amount'], [])
            current_principal_amount = principal_data[0]['principal_amount'] if principal_data and principal_data[0]['principal_amount'] else 0

            # Convert to Birr
            birr_currency = self.env['res.currency'].search(['|', '|', ('name', '=', 'ETB'), ('symbol', '=', 'ETB'), ('currency_unit_label', '=', 'ETB')], limit=1) # Search by name, symbol, or currency_unit_label
            if birr_currency and record.currency_id:
                record.total_balance_accounts = record.currency_id._convert(
                    current_balance, birr_currency, self.env.company, fields.Date.today())
                record.total_principal_amount = record.currency_id._convert(
                    current_principal_amount, birr_currency, self.env.company, fields.Date.today())
                record.currency_id = birr_currency
            else:
                record.total_balance_accounts = current_balance
                record.total_principal_amount = current_principal_amount

            # Loan Applications
            record.total_loan_applications = self.env['x_banking.loan.application'].search_count([])
            record.applications_submitted = self.env['x_banking.loan.application'].search_count([('state', '=', 'submitted')])
            record.applications_approved = self.env['x_banking.loan.application'].search_count([('state', '=', 'approved')])

            # Tickets
            record.total_tickets = self.env['x_banking.ticket'].search_count([])
            record.tickets_open = self.env['x_banking.ticket'].search_count([('state', 'in', ('new', 'in_progress'))])

    @api.model
    def action_open_dashboard(self):
        dashboard = self.sudo().search([], limit=1)
        if not dashboard:
            dashboard = self.sudo().create({'name': 'Dashboard'})
        return {
            'name': 'Overall Banking Dashboard',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.overall.dashboard',
            'res_id': dashboard.id,
            'view_mode': 'form',
            'target': 'main',
        }

    def action_view_leads(self):
        return {
            'name': 'Leads',
            'type': 'ir.actions.act_window',
            'res_model': 'crm.lead',
            'view_mode': 'kanban,tree,form',
            'domain': [],
            'context': {},
        }

    def action_view_customers(self):
        return {
            'name': 'Customers',
            'type': 'ir.actions.act_window',
            'res_model': 'res.partner',
            'view_mode': 'kanban,tree,form',
            'domain': [('customer_rank', '>', 0)],
            'context': {},
        }

    def action_view_bank_accounts(self):
        return {
            'name': 'Bank Accounts',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.account',
            'view_mode': 'tree,form',
            'domain': [],
            'context': {},
        }

    def action_view_loans(self):
        return {
            'name': 'Loans',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.loan',
            'view_mode': 'tree,form',
            'domain': [],
            'context': {},
        }

    def action_view_loan_applications(self):
        return {
            'name': 'Loan Applications',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.loan.application',
            'view_mode': 'kanban,tree,form',
            'domain': [],
            'context': {},
        }

    def action_view_tickets(self):
        return {
            'name': 'Tickets',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.ticket',
            'view_mode': 'kanban,tree,form',
            'domain': [],
            'context': {},
        }

    def action_view_leads_graph(self):
        return {
            'name': 'Leads Analysis',
            'type': 'ir.actions.act_window',
            'res_model': 'crm.lead',
            'view_mode': 'graph',
            'views': [(self.env.ref('odoo_banking_crm.view_crm_lead_graph_by_stage').id, 'graph')],
            'context': {'group_by': 'stage_id'},
        }

    def action_view_customers_graph(self):
        return {
            'name': 'Customer Analysis',
            'type': 'ir.actions.act_window',
            'res_model': 'res.partner',
            'view_mode': 'graph',
            'views': [(self.env.ref('odoo_banking_crm.view_res_partner_graph_by_kyc_status').id, 'graph')],
            'context': {'group_by': 'kyc_status'},
        }

    def action_view_loans_graph(self):
        return {
            'name': 'Loan Analysis',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.loan',
            'view_mode': 'graph',
            'views': [(self.env.ref('odoo_banking_crm.view_banking_loan_graph_by_type').id, 'graph')],
            'context': {'group_by': 'loan_type'},
        }

    def action_view_tickets_graph(self):
        return {
            'name': 'Ticket Analysis',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.ticket',
            'view_mode': 'graph',
            'views': [(self.env.ref('odoo_banking_crm.view_banking_ticket_graph_by_status').id, 'graph')],
            'context': {'group_by': 'state'},
        }

    def action_view_all_external_partners(self):
        return self.env.ref('odoo_banking_crm.action_banking_crm_external_partners').read()[0]

    def action_view_accounts_graph(self):
        return {
            'name': 'Account Analysis',
            'type': 'ir.actions.act_window',
            'res_model': 'x_banking.account',
            'view_mode': 'graph',
            'views': [(self.env.ref('odoo_banking_crm.view_banking_account_graph_by_type').id, 'graph')],
            'context': {'group_by': 'account_type'},
        }
