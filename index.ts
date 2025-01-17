import { Hono } from 'hono'
import geoip from 'geoip-country'
import lookup from 'country-code-lookup'

const app = new Hono()

app.get('/', (c) => {
    return c.json({
        message: 'Welcome to IP Country Lookup API',
        usage: '/lookup/:ip - Get country for an IP address'
    })
})

app.get('/lookup/:ip', (c) => {
    const ip = c.req.param('ip')

    try {
        const geo = geoip.lookup(ip)

        if (!geo) {
            return c.json(
                {
                    error: 'Country not found for the provided IP address'
                },
                404
            )
        }

        const countryInfo = lookup.byIso(geo.country)

        return c.json({
            ip,
            country: geo.country,
            countryName: countryInfo?.country || 'Unknown',
            success: true
        })
    } catch (error) {
        return c.json(
            {
                error: 'Invalid IP address format',
                success: false
            },
            400
        )
    }
})

app.post('/lookup/batch', async (c) => {
    try {
        const body = await c.req.json()

        if (!Array.isArray(body.ips)) {
            return c.json(
                {
                    error: 'Request body must contain an "ips" array',
                    success: false
                },
                400
            )
        }

        const results: Record<
            string,
            { country?: string; countryName?: string; error?: string }
        > = {}

        body.ips.forEach((ip: string) => {
            try {
                const geo = geoip.lookup(ip)
                if (geo) {
                    const countryInfo = lookup.byIso(geo.country)
                    results[ip] = {
                        country: geo.country,
                        countryName: countryInfo?.country || 'Unknown'
                    }
                } else {
                    results[ip] = { error: 'Country not found' }
                }
            } catch (error) {
                results[ip] = { error: 'Invalid IP address format' }
            }
        })

        return c.json({
            results,
            success: true
        })
    } catch (error) {
        return c.json(
            {
                error: 'Invalid JSON payload',
                success: false
            },
            400
        )
    }
})

export default app
