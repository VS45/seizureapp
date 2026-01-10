import { z } from 'zod';

export const officeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
});

export const patrolTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  office: z.string().min(1, 'Office is required'),
  members: z.array(z.string()).default([])
});

export const officerSchema = z.object({
  serviceNo: z.string().min(1, 'Service number is required'),
  rank: z.string().min(1, 'Rank is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  office: z.string().min(1, 'Office is required'),
  patrolTeam: z.string().min(1, 'Patrol team is required'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
});

export const armorySchema = z.object({
  armoryName: z.string().min(1, 'Armory name is required'),
  armoryCode: z.string().min(1, 'Armory code is required'),
  office: z.string().min(1, 'Office is required'),
  location: z.string().min(1, 'Location is required'),
  unit: z.string().min(1, 'Unit is required'),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active')
});

export const distributionSchema = z.object({
  armoryId: z.string().min(1, 'Armory is required'),
  officerId: z.string().min(1, 'Officer is required'),
  squadName: z.string().min(1, 'Squad name is required'),
  weapons: z.array(z.object({
    weaponId: z.string().min(1, 'Weapon ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })).default([]),
  ammunition: z.array(z.object({
    ammunitionId: z.string().min(1, 'Ammunition ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })).default([]),
  equipment: z.array(z.object({
    equipmentId: z.string().min(1, 'Equipment ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })).default([]),
  remarks: z.string().optional()
});

export const renewalSchema = z.object({
  condition: z.string().min(1, 'Condition is required'),
  remarks: z.string().optional(),
  nextRenewalDate: z.string().min(1, 'Next renewal date is required')
});

export const returnSchema = z.object({
  items: z.array(z.object({
    itemRef: z.string().min(1, 'Item reference is required'),
    itemType: z.enum(['weapon', 'ammunition', 'equipment']),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    condition: z.string().min(1, 'Condition is required')
  })),
  remarks: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});