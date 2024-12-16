const chokidar = require('chokidar')

module.exports = {
    devServer: {
        host: '0.0.0.0',
        hot: true,
        allowedHosts: 'all',
        setupMiddlewares(middlewares, devServer) {
            chokidar.watch([
                'kolibri-docs/**/*'
            ]).on('all', function() {
                devServer.sockWrite(devServer.sockets, 'content-changed');
            });
            return middlewares;
        },
    },
    chainWebpack: config => {
        // Markdown Loader
        config.module
            .rule('markdown')
            .test(/\.md$/)
            .use('file-loader')
                .loader('file-loader?name=docs/[name]-[hash:6].[ext]')
                .end()

        config.output.filename('js/[name].[hash:8].js')
        config.output.chunkFilename('js/[name].[hash:8].js')
    },
    publicPath: import.meta.env['IPFS_BUILD'] ? './' : '/',
    css: {
        loaderOptions: {
            css: {
                url: !import.meta.env['IPFS_BUILD'],
            }
        }
    }
};
