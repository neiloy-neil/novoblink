import ContentPage, { renderContentPage } from "@/components/store/ContentPage"

export default async function FaqPage() {
  const { title, content } = await renderContentPage("faq", "FAQ & Shipping")
  return <ContentPage title={title} content={content} />
}
