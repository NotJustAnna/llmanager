import {build, type CompileBuildConfig, type CompileBuildOptions} from "bun";
import tailwindPlugin from "bun-plugin-tailwind";

interface BuildArgs {
  target?: string;
}

// Parse command line arguments
function parseArgs(): BuildArgs {
  const args = process.argv.slice(2);
  const config: BuildArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--target" && args[i + 1]) {
      config.target = args[i + 1];
      i++;
    }
  }

  return config;
}

function generateBuildConfig(config: BuildArgs): CompileBuildConfig {
  const compile: CompileBuildOptions = {
    outfile: 'llmanager',
  };
  if (config.target) {
    compile.target = config.target as Bun.Build.Target;
  }
  return {
    entrypoints: ["./src/index.ts"],
    plugins: [tailwindPlugin],
    compile,
    minify: true,
    sourcemap: true,
    bytecode: true,
    jsx: {
      development: false,
    }
  }
}

async function main() {
  const args = parseArgs();
  const config = generateBuildConfig(args);
  await build(config);

  console.log("✓ Build completed successfully");
}

main().catch((err) => {
  console.error("✗ Build failed:");
  console.error(err);
  process.exit(1);
});
