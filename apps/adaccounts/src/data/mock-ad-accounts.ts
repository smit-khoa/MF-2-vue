import type { AdAccount } from '../types/ad-account';

// Static demo data for the prototype. Swap to a real API call inside
// use-ad-accounts.ts when the gateway endpoint is available — the AdAccount[]
// shape stays stable so views never change.
export const MOCK_AD_ACCOUNTS: AdAccount[] = [
  { id: 'act_1001', name: 'SMIT - Brand Awareness Q2', status: 'active', budget: 5_000_000, currency: 'VND' },
  { id: 'act_1002', name: 'SMIT - Retargeting Web', status: 'active', budget: 2_500_000, currency: 'VND' },
  { id: 'act_1003', name: 'SMIT - Lead Form T6', status: 'paused', budget: 1_200_000, currency: 'VND' },
  { id: 'act_1004', name: 'Shop A - Conversion Sale', status: 'active', budget: 8_000_000, currency: 'VND' },
  { id: 'act_1005', name: 'Shop A - Catalog Ads', status: 'disabled', budget: 0, currency: 'VND' },
  { id: 'act_1006', name: 'Shop B - Traffic Blog', status: 'active', budget: 900_000, currency: 'VND' },
  { id: 'act_1007', name: 'Shop B - Video Views', status: 'paused', budget: 3_300_000, currency: 'VND' },
  { id: 'act_1008', name: 'Client X - App Install', status: 'active', budget: 12_000_000, currency: 'VND' },
  { id: 'act_1009', name: 'Client X - Remarketing', status: 'active', budget: 4_600_000, currency: 'VND' },
  { id: 'act_1010', name: 'Client Y - Messenger', status: 'paused', budget: 1_800_000, currency: 'VND' },
  { id: 'act_1011', name: 'Client Y - Lead Gen', status: 'active', budget: 2_200_000, currency: 'VND' },
  { id: 'act_1012', name: 'Agency - Test Creative', status: 'disabled', budget: 0, currency: 'VND' },
  { id: 'act_1013', name: 'Agency - Scale Winner', status: 'active', budget: 25_000_000, currency: 'VND' },
  { id: 'act_1014', name: 'Promo Tết - Awareness', status: 'paused', budget: 6_700_000, currency: 'VND' },
  { id: 'act_1015', name: 'Promo Tết - Conversion', status: 'active', budget: 15_400_000, currency: 'VND' },
  { id: 'act_1016', name: 'Local - Hà Nội Store', status: 'active', budget: 1_100_000, currency: 'VND' },
  { id: 'act_1017', name: 'Local - HCM Store', status: 'active', budget: 1_350_000, currency: 'VND' },
  { id: 'act_1018', name: 'Local - Đà Nẵng Store', status: 'paused', budget: 750_000, currency: 'VND' },
  { id: 'act_1019', name: 'Seeding - KOL Campaign', status: 'active', budget: 9_900_000, currency: 'VND' },
  { id: 'act_1020', name: 'Seeding - Micro Influencer', status: 'disabled', budget: 0, currency: 'VND' },
  { id: 'act_1021', name: 'B2B - LinkedIn Mirror', status: 'active', budget: 3_000_000, currency: 'VND' },
  { id: 'act_1022', name: 'B2B - Whitepaper Lead', status: 'paused', budget: 2_700_000, currency: 'VND' },
  { id: 'act_1023', name: 'Ecom - Black Friday', status: 'active', budget: 30_000_000, currency: 'VND' },
  { id: 'act_1024', name: 'Ecom - Flash Sale 12.12', status: 'active', budget: 18_500_000, currency: 'VND' },
];
