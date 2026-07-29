import ContentPage, { renderContentPage } from "@/components/store/ContentPage"

export default async function ReturnsPage() {
  const { title, content } = await renderContentPage("returns", "Returns & Exchanges")
  return <ContentPage title={title} content={content} />
}
