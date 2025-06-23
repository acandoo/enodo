// import { type Config } from "prettier";
// const config: Config

const config = {
    plugins: ['@trivago/prettier-plugin-sort-imports'],
    trailingComma: 'none',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    importOrder: ['^node:', '^[^@./][^/]*', '^@', '^[./]'],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true
}

export default config
