const MASKS = {
  classic: { name: 'Classic', color: 'accent',  fixed: null,      bonus: null,      cost: 0   },
  crimson: { name: 'Crimson', color: 'fixed',   fixed: '#dc2626', bonus: 'score2x', cost: 200 },
  amber:   { name: 'Amber',   color: 'fixed',   fixed: '#d97706', bonus: 'coin2x',  cost: 400 },
  emerald: { name: 'Emerald', color: 'fixed',   fixed: '#059669', bonus: 'shield',  cost: 650 },
  void:    { name: 'Void',    color: 'fixed',   fixed: '#7c3aed', bonus: 'freeze',  cost: 900 }
};

const MASK_ORDER = ['classic', 'crimson', 'amber', 'emerald', 'void'];

function maskColor(id) {
  const m = MASKS[id];
  if (!m) return cv('--accent');
  return m.fixed || cv('--accent');
}
