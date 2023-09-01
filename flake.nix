{
  description = "Nix Flake";
  inputs = {
    nixpkgs.url = "github:anmonteiro/nix-overlays";
    nix-filter.url = "github:numtide/nix-filter";
    flake-utils.url = "github:numtide/flake-utils";
    dream2nix.url = "github:nix-community/dream2nix/legacy";
    dream2nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = {
    self,
    nixpkgs,
    nix-filter,
    flake-utils,
    dream2nix,
  }:
    flake-utils.lib.eachDefaultSystem
    (
      system: let
        pkgs = nixpkgs.makePkgs {
          inherit system;
        };
      in let
        seta-js-output = dream2nix.lib.makeFlakeOutputs {
          config.projectRoot = ./.;
          source = nix-filter.lib.filter {
            root = ./.;
            include = [
              "yarn.lock"
              "package.json"
            ];
          };
          packageOverrides = {
            webpack-cli = {
              remove-webpack-check = {
                patches = [./nix/remove-webpack-check.patch];
              };
            };
          };
          systems = [system];
          autoProjects = true;
          settings = [
            {
              subsystemInfo.nodejs = 18;
            }
          ];
        };
        webpack = npmPackages.dependencies.webpack.overrideAttrs (_: {
          postFixup = ''
            wrapProgram $out/bin/webpack \
            --set NODE_PATH=${npmPackages}/lib/node_modules/seta-js/node_modules:${
              builtins.foldl' (prev: curr: prev + ":" + curr) "$NODE_PATH"
              node_modules'
            }
          '';
        });
        npmPackages = seta-js-output.packages."${system}".seta-js;
        node_modules' =
          builtins.attrValues
          (builtins.removeAttrs npmPackages.dependencies ["webpack"]);
        node_modules = node_modules' ++ [webpack];
      in {
        devShells.default = seta-js-output.devShells.${system}.default;
        packages = {
          my-pkg = pkgs.stdenv.mkDerivation {
            name = "my-pkg";
            src = nix-filter.lib.filter {
              root = ./.;
              include = ["main.ts" "package.json" "yarn.lock" "webpack.config.js" "tsconfig.json"];
            };
            buildInputs = node_modules;
            buildPhase = ''
              ls -la
              webpack
              mkdir -p $out/dist 
              cp ./main.bundle.js $out/dist
            '';
          };
        };
      }
    );
}
