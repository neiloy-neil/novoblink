import BundleForm from "../BundleForm"
export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BundleForm bundleId={id} />
}
