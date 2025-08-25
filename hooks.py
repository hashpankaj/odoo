# hooks.py
from odoo import api, SUPERUSER_ID

def post_init_hook(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    partners = env['res.partner'].search([])
    partners._compute_is_internal_user()
