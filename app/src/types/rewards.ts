// Extensión de campos para Customer (se agregará a customer.ts)
export interface CustomerRewardsFields {
  programa_referidos: boolean;
  puntos_compras: number;
  puntos_referidos: number;
  referidos: number;
  latitud?: string;
  longitud?: string;
  ip?: string;
  terminos_condiciones: boolean;
  fecha_tyc?: Date;
  fecha_habilitacion_premios?: Date;
  geolocalizacion_aceptada: boolean;
  referente_id?: string;
  referente_cel?: number;
  referente_nombre?: string;
}

// Movimiento de puntos
export interface RewardMovement {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  type: 'compra' | 'referido' | 'canje' | 'super_premio';
  points: number;
  order_id?: string;
  order_total?: number;
  products_consumed?: string[];
  referral_customer_id?: string;
  referral_customer_name?: string;
  prize_redeemed?: string;
  created_at: Date;
  created_by: string;
}

// Premio disponible
export interface RewardPrize {
  id: string;
  product_id: string;
  product_name: string;
  product_cost: number;
  points_required: number;
  is_active: boolean;
  is_super_prize: boolean;
  created_at: Date;
  created_by: string;
}

// Canje realizado
export interface RewardRedemption {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  prize_id: string;
  prize_name: string;
  prize_cost: number;
  points_used: number;
  is_super_prize: boolean;
  order_id?: string;
  redeemed_at: Date;
  redeemed_by: string;
}

// Configuración del sistema
export interface RewardsConfig {
  id: string;
  min_purchase_amount: number; // S/15.00
  points_per_purchase: number; // 1
  points_for_prize: number; // 6
  max_referrals_per_month: number; // 5
  referral_validity_days: number; // 15
  max_prize_cost: number; // S/12.00
  super_prize_requirements: number; // 3 premios
  super_prize_period_months: number; // 2 meses
  max_super_prizes_per_period: number; // 2
  super_prize_product_name: string; // "Hamburguesa + Milkshake Oreo"
  updated_at: Date;
  updated_by: string;
}

// Control de super premios
export interface SuperPrizeControl {
  id: string;
  customer_id: string;
  customer_name: string;
  redemptions_count: number;
  period_start: Date;
  period_end: Date;
  super_prizes_earned: number;
  super_prizes_used: number;
  last_redemption: Date;
  created_at: Date;
}

// Estadísticas del programa
export interface RewardsStats {
  total_customers: number;
  active_customers: number;
  total_points_earned: number;
  total_points_redeemed: number;
  total_prizes_redeemed: number;
  total_cost_prizes: number;
  total_revenue_generated: number;
  conversion_rate: number;
}

// Búsqueda de cliente
export interface CustomerRewardsSearch {
  customer: CustomerRewardsFields & {
    id: string;
    name: string;
    phone: string;
  };
  total_points: number;
  can_redeem: boolean;
  movements: RewardMovement[];
  redemptions: RewardRedemption[];
  referred_customers?: any[];
  referral_expirations?: {
    customer_name: string;
    customer_phone: string;
    expiration_date: Date;
  }[];
  super_prize_status?: SuperPrizeControl;
}