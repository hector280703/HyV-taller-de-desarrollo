import useTable from '@hooks/table/useTable.jsx';

export default function Table({ data, columns, filter, dataToFilter, initialSortName, onSelectionChange, selectable = true }) {
  const { tableRef } = useTable({ data, columns, filter, dataToFilter, initialSortName, onSelectionChange, selectable });

  return (
    <div className='table-container'>
      <div ref={tableRef}></div>
    </div>
  );
}