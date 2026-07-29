import { NextResponse } from "next/server"
import { getCities, getZones, getAreas } from "@/lib/pathao"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    
    if (type === "cities") {
      const data = await getCities()
      return NextResponse.json(data)
    } 
    else if (type === "zones") {
      const cityId = searchParams.get("cityId")
      if (!cityId) return NextResponse.json({ error: "cityId required" }, { status: 400 })
      const data = await getZones(parseInt(cityId))
      return NextResponse.json(data)
    } 
    else if (type === "areas") {
      const zoneId = searchParams.get("zoneId")
      if (!zoneId) return NextResponse.json({ error: "zoneId required" }, { status: 400 })
      const data = await getAreas(parseInt(zoneId))
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
