
const path = require('path');
const fs = require('fs');

// Function to find package.json in various locations
const findPackageJson = () => {
  const possibleLocations = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    '/app',
    path.resolve(process.cwd(), 'app')
  ];
  
  for (const location of possibleLocations) {
    const packagePath = path.join(location, 'package.json');
    try {
      if (fs.existsSync(packagePath)) {
        console.log(`Found package.json at: ${packagePath}`);
        return location;
      }
    } catch (e) {
      console.log(`Error checking ${packagePath}: ${e.message}`);
    }
  }
  
  console.log('Using default location for package.json');
  return process.cwd();
};

const contextPath = findPackageJson();
console.log(`Using context path: ${contextPath}`);

module.exports = {
  mode: 'development',
  entry: './src/main.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    port: 8080,
    hot: true,
    client: {
      overlay: true,
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    fallback: {
      // Provide polyfills for Node.js core modules
      "path": require.resolve("path-browserify"),
      "fs": false,
      "os": require.resolve("os-browserify/browser"),
      "process": require.resolve("process/browser"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  // Add Node.js environment polyfills
  node: {
    global: true,
  },
  // Use found context path
  context: contextPath,
  // Add resolveLoader to help find loaders
  resolveLoader: {
    modules: [
      'node_modules',
      path.resolve(contextPath, 'node_modules'),
      path.resolve(__dirname, 'node_modules')
    ]
  }
};
