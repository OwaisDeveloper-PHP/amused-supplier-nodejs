import { Request, Response } from 'express';
import { prisma } from '../db';
import { renderPage } from '../utils/renderPage';

export async function index(req: Request, res: Response) {
  const [total, pending, approved, rejected, pushed, suppliers, activeSuppliers, productsSyncedSum, byBrand, recent] =
    await Promise.all([
      prisma.sellWithUsSubmission.count(),
      prisma.sellWithUsSubmission.count({ where: { status: 'pending' } }),
      prisma.sellWithUsSubmission.count({ where: { status: 'approved' } }),
      prisma.sellWithUsSubmission.count({ where: { status: 'rejected' } }),
      prisma.sellWithUsSubmission.count({ where: { pushedToShopifyAt: { not: null } } }),
      prisma.supplier.count(),
      prisma.supplier.count({ where: { status: 'active' } }),
      prisma.supplier.aggregate({ _sum: { productsSynced: true } }),
      prisma.sellWithUsSubmission.groupBy({
        by: ['brand'],
        _count: { brand: true },
        where: { brand: { not: null } },
        orderBy: { _count: { brand: 'desc' } },
      }),
      prisma.sellWithUsSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

  const stats = {
    total,
    pending,
    approved,
    rejected,
    pushed,
    suppliers,
    activeSuppliers,
    productsSynced: productsSyncedSum._sum.productsSynced ?? 0,
  };

  const byBrandView = byBrand.map((b) => ({ brand: b.brand, total: b._count.brand }));

  await renderPage(res, 'dashboard/index', {
    title: 'Dashboard',
    crumb: 'Overview',
    stats,
    byBrand: byBrandView,
    recent,
  });
}
