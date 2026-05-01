import React, { Suspense } from 'react';
import EditBlogForm from '@/app/components/Blog/EditFOrm';

function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditBlogForm />
    </Suspense>
  );
}

export default Page;