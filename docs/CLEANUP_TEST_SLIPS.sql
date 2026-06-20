-- View all existing loading slips
SELECT id, slip_number, to_name, created_at 
FROM loading_slips 
ORDER BY created_at DESC;

-- Delete all test loading slips (BE CAREFUL - this deletes all slips)
-- Uncomment the line below only if you want to delete all test data
-- DELETE FROM loading_slips WHERE slip_number LIKE 'QLS-%';

-- Or delete specific slip numbers
-- DELETE FROM loading_slips WHERE slip_number = 'QLS-1';
-- DELETE FROM loading_slips WHERE slip_number = 'QLS-2';

-- Verify deletion
SELECT COUNT(*) as remaining_slips FROM loading_slips;
