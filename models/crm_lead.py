from odoo import fields, models, api

class CrmLead(models.Model):
    _inherit = 'crm.lead'

    expected_product_type = fields.Selection([
        ('loan', 'Loan'),
        ('account', 'Bank Account'),
        ('credit_card', 'Credit Card'),
        ('investment', 'Investment'),
        ('other', 'Other'),
    ], string='Expected Product Type', tracking=True)
    lead_source_bank = fields.Char(string='Bank Lead Source', tracking=True)

    estimated_income = fields.Monetary(string='Estimated Income', currency_field='company_currency')
    employment_status = fields.Selection([
        ('employed', 'Employed'),
        ('unemployed', 'Unemployed'),
        ('self_employed', 'Self-Employed'),
        ('student', 'Student'),
    ], string='Employment Status')
    existing_customer = fields.Boolean(string='Existing Customer')
    lead_score = fields.Integer(string='Lead Score', compute='_compute_lead_score', store=True)

    # Lead Enquiry / Pre-Screening Fields
    customer_name_first = fields.Char(string='First Name')
    customer_name_middle = fields.Char(string='Middle Name')
    customer_name_last = fields.Char(string='Last Name')
    mobile_number = fields.Char(string='Mobile Number')
    national_id = fields.Char(string='National ID / Kebele ID')
    gender = fields.Selection([
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ], string='Gender')
    date_of_birth = fields.Date(string='Date of Birth')
    marital_status = fields.Selection([
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ], string='Marital Status')
    residence_woreda = fields.Char(string='Woreda')
    residence_sub_city = fields.Char(string='Sub-city')
    residence_region = fields.Char(string='Region')
    employment_type = fields.Selection([
        ('salaried', 'Salaried'),
        ('self_employed', 'Self-employed'),
        ('business_owner', 'Business Owner'),
        ('farmer', 'Farmer'),
    ], string='Employment Type')
    monthly_annual_income = fields.Monetary(string='Monthly/Annual Income (ETB)', currency_field='company_currency')
    requested_loan_amount = fields.Monetary(string='Requested Loan Amount', currency_field='company_currency')
    loan_purpose = fields.Selection([
        ('home', 'Home'),
        ('auto', 'Auto'),
        ('business', 'Business'),
        ('education', 'Education'),
        ('agriculture', 'Agriculture'),
        ('personal', 'Personal'),
        ('emergency', 'Emergency'),
        ('other', 'Other'),
    ], string='Loan Purpose')
    preferred_branch = fields.Char(string='Preferred Branch') # Assuming no res.branch model for now
    preferred_loan_officer_id = fields.Many2one('res.users', string='Preferred Loan Officer')
    is_existing_bank_customer = fields.Boolean(string='Existing Bank Customer?')
    existing_account_number = fields.Char(string='Existing Account #')
    has_regular_income_source = fields.Boolean(string='Regular Income Source?')
    servicing_other_loans = fields.Boolean(string='Servicing Other Loans?')
    collateral_security_details = fields.Text(string='Collateral/Security Details')
    has_guarantor = fields.Boolean(string='Has Guarantor?')
    is_eligible = fields.Boolean(string='Is Eligible', compute='_compute_is_eligible', store=True)

    @api.depends('date_of_birth', 'monthly_annual_income', 'employment_type', 'loan_purpose')
    def _compute_is_eligible(self):
        for lead in self:
            is_eligible = True
            # Basic eligibility checks
            # Age check (e.g., must be at least 18 years old)
            if lead.date_of_birth:
                today = fields.Date.today()
                age = today.year - lead.date_of_birth.year - ((today.month, today.day) < (lead.date_of_birth.month, lead.date_of_birth.day))
                if age < 18:
                    is_eligible = False
            else:
                is_eligible = False # Date of birth is required for eligibility

            # Income check (e.g., minimum income for a loan)
            if lead.monthly_annual_income < 10000: # Example minimum income
                is_eligible = False

            # Employment type check (e.g., certain employment types might not be eligible for certain loans)
            if lead.employment_type == 'student' and lead.loan_purpose in ['home', 'business']:
                is_eligible = False

            lead.is_eligible = is_eligible

    @api.depends('estimated_income', 'employment_status', 'existing_customer')
    def _compute_lead_score(self):
        for lead in self:
            score = 0
            if lead.existing_customer:
                score += 20
            if lead.employment_status == 'employed':
                score += 20
            elif lead.employment_status == 'self_employed':
                score += 15
            if lead.estimated_income > 50000:
                score += 20
            elif lead.estimated_income > 25000:
                score += 10
            lead.lead_score = score

    def action_create_loan_application(self):
        self.ensure_one()

        # 1. Create or link res.partner
        if not self.partner_id:
            partner_vals = {
                'name': self.contact_name or self.name,
                'email': self.email_from,
                'phone': self.phone,
                'mobile': self.mobile,
                'type': 'contact',
                'customer': True,
                'date_of_birth': self.date_of_birth,
                'gender': self.gender,
                'marital_status': self.marital_status,
                'street': self.residence_woreda, # Using woreda as street for simplicity
                'city': self.residence_sub_city,
                'state_id': self.env['res.country.state'].search([('name', '=', self.residence_region)], limit=1).id, # Assuming region maps to state
                'full_legal_name': f"{self.customer_name_first or ''} {self.customer_name_middle or ''} {self.customer_name_last or ''}".strip(),
                'nationality': self.env['res.country'].search([('code', '=', 'ET')], limit=1).id, # Assuming Ethiopia for now
                'taxpayer_identification_number': self.national_id, # Using national_id as TIN for simplicity
                'occupation': self.employment_type, # Using employment_type as occupation for simplicity
                'source_of_income': self.monthly_annual_income, # Using income as source of income for simplicity
            }
            partner = self.env['res.partner'].create(partner_vals)
            self.partner_id = partner.id
        else:
            partner = self.partner_id

        # 2. Create x_banking.loan.application
        loan_app_vals = {
            'partner_id': partner.id,
            'loan_type': 'retail', # Defaulting to retail, can be refined
            'loan_product': self.loan_purpose, # Using loan_purpose as loan_product
            'requested_amount': self.requested_loan_amount,
            'tenure': 12, # Default tenure, can be refined
            'repayment_frequency': 'monthly', # Default, can be refined
            'proposed_collateral_type': 'other', # Default, can be refined
            'collateral_valuation': 0.0, # Default, can be refined
            'repayment_source': 'other', # Default, can be refined
            'monthly_net_income': self.monthly_annual_income,
            'existing_loan_repayments': 0.0, # Default, can be refined
            'other_household_expenses': 0.0, # Default, can be refined
        }
        loan_application = self.env['x_banking.loan.application'].create(loan_app_vals)

        # 3. Optionally, change lead stage or mark as won/lost
        # self.write({'stage_id': self.env.ref('crm.stage_lead_won').id}) # Example: Mark lead as won

        # Return an action to open the newly created loan application
        return {
            'type': 'ir.actions.act_window',
            'name': 'Loan Application',
            'res_model': 'x_banking.loan.application',
            'res_id': loan_application.id,
            'view_mode': 'form',
            'target': 'current',
        }
