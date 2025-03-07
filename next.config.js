/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // swcMinify ist in Next.js 15 standardmäßig aktiviert und nicht mehr nötig
    // Aktiviere die neue App-Router-Funktionalität
    experimental: {
        // Diese Option kann je nach Next.js-Version variieren
        // serverActions: true,
    },
    images: {
        domains: ['localhost'],
    },
    eslint: {
        // Warnung: Im Produktionsmodus sollte dies auf 'true' gesetzt werden
        ignoreDuringBuilds: false,
    },
    typescript: {
        // Warnung: Im Produktionsmodus sollte dies auf 'true' gesetzt werden
        ignoreBuildErrors: false,
    },
    // Lösen des Problems mit dem doppelten favicon.ico
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }
        return config;
    },
    // Konfiguration von HTTP-Headern für Sicherheit
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },
    // Weiterleitungen und Rewrites
    async redirects() {
        return [
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
            // Umleitung für favicon.ico zur Vermeidung des Konflikts
            {
                source: '/favicon.ico',
                destination: '/public/favicon.ico',
                permanent: true,
            },
        ];
    },
};

module.exports = nextConfig;