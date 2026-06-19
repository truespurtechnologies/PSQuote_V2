// Manual test script for QuotationDB
import { QuotationDB } from '../lib/quotation-db';

async function runTests() {
  console.log('Starting QuotationDB manual tests...');
  
  try {
    // Test 1: Initialize the database
    console.log('\n--- Test 1: Initialize Database ---');
    const isInitialized = await QuotationDB.initialize();
    console.log(`Database initialized: ${isInitialized}`);
    
    // Test 2: Create a new quotation
    console.log('\n--- Test 2: Create New Quotation ---');
    const newQuotation = {
      quotationNumber: await QuotationDB.generateQuotationNumber(),
      customerId: 'test-customer-1',
      date: '2023-05-01',
      validUntil: '2023-06-01',
      status: 'draft',
      notes: 'Test quotation',
      termsConditions: ['7 days validity', 'Prices subject to change'],
      subtotal: 5000,
      discountAmount: 0,
      taxAmount: 900,
      totalAmount: 5900,
      userId: 'test-user-1',
      items: [
        {
          id: 'item-1',
          description: 'Test Item',
          requiredQty: 10,
          qtyInKgPc: 5,
          totalQtyKg: 50,
          unitRate: 100,
          totalValue: 5000
        }
      ],
      charges: {
        gst: { rate: 18, amount: 900 }
      },
      totals: {
        subtotal: 5000,
        tax: 900,
        total: 5900
      }
    };
    
    const savedQuotation = await QuotationDB.saveQuotation(newQuotation);
    console.log('Saved Quotation:', JSON.stringify(savedQuotation, null, 2));
    
    if (!savedQuotation || !savedQuotation.id) {
      throw new Error('Failed to save quotation');
    }
    
    // Test 3: Get quotation by ID
    console.log('\n--- Test 3: Get Quotation by ID ---');
    const retrievedQuotation = await QuotationDB.getQuotationById(savedQuotation.id);
    console.log('Retrieved Quotation:', JSON.stringify(retrievedQuotation, null, 2));
    
    if (!retrievedQuotation || retrievedQuotation.id !== savedQuotation.id) {
      throw new Error('Failed to retrieve quotation by ID');
    }
    
    // Test 4: Update quotation
    console.log('\n--- Test 4: Update Quotation ---');
    const updatedQuotation = {
      ...retrievedQuotation,
      to: 'Updated Customer',
      items: retrievedQuotation.items?.map(item => ({
        ...item,
        description: 'Updated Item'
      })) || []
    };
    
    const result = await QuotationDB.saveQuotation(updatedQuotation);
    console.log('Updated Quotation:', JSON.stringify(result, null, 2));
    
    // Test 5: Get all quotations
    console.log('\n--- Test 5: Get All Quotations ---');
    const allQuotations = await QuotationDB.getAllQuotations();
    console.log(`Found ${allQuotations.length} quotations`);
    console.log('All Quotations:', JSON.stringify(allQuotations, null, 2));
    
    // Test 6: Delete quotation
    console.log('\n--- Test 6: Delete Quotation ---');
    const deleteResult = await QuotationDB.deleteQuotation(savedQuotation.id);
    console.log(`Quotation deleted: ${deleteResult}`);
    
    // Verify deletion
    const deletedQuotation = await QuotationDB.getQuotationById(savedQuotation.id);
    if (deletedQuotation) {
      throw new Error('Quotation was not deleted');
    }
    
    console.log('\n✅ All tests passed successfully!');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('\n❌ Test failed:', error.message);
      console.error(error.stack);
    } else {
      console.error('\n❌ Test failed with unknown error:', error);
    }
    process.exit(1);
  }
}

// Run the tests
runTests();
