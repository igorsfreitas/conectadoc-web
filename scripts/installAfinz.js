const { execSync } = require("child_process");
const fs = require("fs");

console.log("🧹 Limpando dependências antigas...\n");

try {
  if (fs.existsSync("node_modules")) {
    fs.rmSync("node_modules", { recursive: true, force: true });
    console.log("🗑️  node_modules removido");
  }
  if (fs.existsSync("package-lock.json")) {
    fs.rmSync("package-lock.json");
    console.log("🗑️  package-lock.json removido");
  }
} catch (err) {
  console.error("⚠️  Erro ao remover arquivos:", err.message);
}

console.log("\n📦 Instalando dependências atualizadas...\n");

try {
  execSync("npm install", { stdio: "inherit" });
  console.log("\n✅ Instalação concluída com sucesso!");
} catch (err) {
  console.error("\n❌ Erro ao instalar dependências:", err.message);
  process.exit(1);
}
