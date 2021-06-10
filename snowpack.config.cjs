module.exports = {
  mount: {
    public: {url: '/example', static: true},
    src:{url: '/dist'},
  },
  devOptions: {
    open: 'none',
  },
  plugins: [
    '@snowpack/plugin-typescript',
  ],
}
