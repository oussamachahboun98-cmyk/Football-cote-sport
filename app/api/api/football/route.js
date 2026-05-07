export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "/status";

  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY,
    },
  });

  const data = await res.json();

  return Response.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
