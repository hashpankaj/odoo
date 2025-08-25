# models/res_partner_extension.py
from odoo import fields, models, api

class ResPartner(models.Model):
    _inherit = 'res.partner'

    isInternal_user = fields.Boolean(
        string='Is Internal User',
        compute='_compute_is_internal_user',
        store=True,  # Store the computed value in the database
        help="Indicates if this partner is an internal Odoo user."
    )
    card_ids = fields.One2many(
        'banking.card',
        'partner_id',
        string='Cards'
    )

    @api.depends('user_ids')
    def _compute_is_internal_user(self):
        for partner in self:
            partner.isInternal_user = bool(partner.user_ids)
