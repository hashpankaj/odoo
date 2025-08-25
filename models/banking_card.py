from odoo import api, fields, models

class BankingCard(models.Model):
    _name = 'banking.card'
    _description = 'Banking Card'

    name = fields.Char(string='Card Number', required=True, copy=False,
                       help="Unique identifier for the banking card")
    card_type = fields.Selection([
        ('credit', 'Credit Card'),
        ('debit', 'Debit Card'),
        ('prepaid', 'Prepaid Card'),
    ], string='Card Type', required=True)
    expiration_date = fields.Date(string='Expiration Date', required=True)
    cardholder_name = fields.Char(string='Cardholder Name', compute='_compute_cardholder_name', store=True)
    account_id = fields.Many2one('x_banking.account', string='Bank Account', required=True, ondelete='restrict')
    partner_id = fields.Many2one('res.partner', string='Cardholder', required=True, ondelete='restrict')
    is_active = fields.Boolean(string='Is Active', default=True)

    @api.depends('partner_id')
    def _compute_cardholder_name(self):
        for card in self:
            card.cardholder_name = card.partner_id.name

    @api.model
    def create(self, vals_list):
        # Ensure vals_list is always a list of dictionaries
        if not isinstance(vals_list, list):
            vals_list = [vals_list]

        print(f"Type of vals_list (after check): {type(vals_list)}")
        for vals in vals_list:
            print(f"Type of vals (after check): {type(vals)}")
            print(f"Vals content (after check): {vals}")

            current_partner_id = None
            if isinstance(vals, dict) and 'partner_id' in vals:
                current_partner_id = vals['partner_id']
            elif self.env.context.get('default_partner_id'):
                current_partner_id = self.env.context.get('default_partner_id')

            if current_partner_id and 'account_id' not in vals:
                # Ensure current_partner_id is an integer before browsing
                if isinstance(current_partner_id, str) and current_partner_id.isdigit():
                    current_partner_id = int(current_partner_id)
                elif not isinstance(current_partner_id, int):
                    # If it's not an integer or a digit string, it's an unexpected type.
                    # We should log this or raise an error. For now, let's skip.
                    continue

                partner = self.env['res.partner'].browse(current_partner_id)
                if partner:
                    bank_accounts = self.env['x_banking.account'].search([('partner_id', '=', partner.id)])
                    if len(bank_accounts) == 1:
                        vals['account_id'] = bank_accounts[0].id
        return super().create(vals_list)
