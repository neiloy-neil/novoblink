import ContentPage, { renderContentPage } from "@/components/store/ContentPage"

export default async function SizeGuidePage() {
  const { title, content } = await renderContentPage("size-guide", "Size Guide")
  return <ContentPage title={title} content={content} />
}
