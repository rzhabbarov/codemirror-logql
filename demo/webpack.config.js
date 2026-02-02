const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = () => {
    return {
        entry: {
            app: path.resolve(__dirname, 'src', 'index'),
        },
        target: 'web',
        resolve: {
            extensions: ['.js', '.ts']
        },
        output: {
            filename: '[name].[contenthash].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: 'auto',
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'public', 'index.html'),
                publicPath: '/',
            }),
        ],
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
            },
            allowedHosts: ['localhost'],
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            hot: true,
            port: 3000,
            proxy: [
                {
                    context: ['/grafanaApi/'],
                    secure: false,
                    changeOrigin: true,
                    target: `https://play.grafana.org/api/`,
                    pathRewrite: { '^/grafanaApi': '' }
                }
            ]
        }
    }
}