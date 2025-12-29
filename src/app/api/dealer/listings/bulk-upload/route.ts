import { NextRequest, NextResponse } from 'next/server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Database Integration Placeholder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// When Prisma is reintroduced:
// 1. Uncomment: import { PrismaClient } from '@prisma/client';
// 2. Initialize: const prisma = new PrismaClient();
// 3. Replace stub implementations with actual database queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BulkUploadValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
}

export interface BulkListingRow {
  stockNumber: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
}

/**
 * Parse CSV content and validate required columns
 */
function parseCSV(content: string): { rows: BulkListingRow[]; validation: BulkUploadValidation } {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    return {
      rows: [],
      validation: {
        valid: false,
        errors: ['File is empty or has no data rows'],
        warnings: [],
        rowCount: 0,
      },
    };
  }

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  // Required columns
  const requiredColumns = ['stock_number', 'vin', 'year', 'make', 'model', 'price', 'mileage'];
  const missingColumns = requiredColumns.filter(col => 
    !headers.some(h => h.includes(col.replace('_', '')))
  );

  if (missingColumns.length > 0) {
    return {
      rows: [],
      validation: {
        valid: false,
        errors: [`Missing required columns: ${missingColumns.join(', ')}`],
        warnings: [],
        rowCount: 0,
      },
    };
  }

  // Map column indices
  const colMap: Record<string, number> = {};
  requiredColumns.forEach(col => {
    const idx = headers.findIndex(h => h.includes(col.replace('_', '')));
    colMap[col] = idx;
  });
  colMap.trim = headers.findIndex(h => h.includes('trim'));

  const rows: BulkListingRow[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    
    try {
      const stockNumber = cols[colMap.stock_number];
      const vin = cols[colMap.vin];
      const year = parseInt(cols[colMap.year]);
      const make = cols[colMap.make];
      const model = cols[colMap.model];
      const price = parseFloat(cols[colMap.price].replace(/[$,]/g, ''));
      const mileage = parseInt(cols[colMap.mileage].replace(/,/g, ''));

      // Validation
      if (!stockNumber || !vin) {
        errors.push(`Row ${i + 1}: Missing stock number or VIN`);
        continue;
      }
      if (vin.length !== 17) {
        warnings.push(`Row ${i + 1}: VIN ${vin} may be invalid (not 17 characters)`);
      }
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
        errors.push(`Row ${i + 1}: Invalid year ${cols[colMap.year]}`);
        continue;
      }
      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${i + 1}: Invalid price ${cols[colMap.price]}`);
        continue;
      }
      if (isNaN(mileage) || mileage < 0) {
        errors.push(`Row ${i + 1}: Invalid mileage ${cols[colMap.mileage]}`);
        continue;
      }

      rows.push({
        stockNumber,
        vin: vin.toUpperCase(),
        year,
        make,
        model,
        trim: colMap.trim >= 0 ? cols[colMap.trim] : undefined,
        price,
        mileage,
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: Parse error - ${err}`);
    }
  }

  return {
    rows,
    validation: {
      valid: errors.length === 0 && rows.length > 0,
      errors,
      warnings,
      rowCount: rows.length,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { error: 'Missing dealerId parameter' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(fileType || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: CSV, XLS, XLSX' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();
    
    // Parse and validate
    const { rows, validation } = parseCSV(content);

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        validation,
      }, { status: 400 });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: Replace with actual Prisma bulk insert
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // await prisma.listing.createMany({
    //   data: rows.map(row => ({
    //     dealerId,
    //     stockNumber: row.stockNumber,
    //     vin: row.vin,
    //     year: row.year,
    //     make: row.make,
    //     model: row.model,
    //     trim: row.trim,
    //     price: row.price,
    //     mileage: row.mileage,
    //     status: 'pending',
    //     photos: [],
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   })),
    // });
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    return NextResponse.json({
      success: true,
      validation,
      inserted: rows.length,
    });
  } catch (error) {
    console.error('[Bulk Upload API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}
