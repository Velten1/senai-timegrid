# Imagem base
FROM node:22-alpine3.23

# Diretório de trabalho dentro do container
WORKDIR /app_senai_grade_horarios

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm install

# Copia todo o restante do código
COPY . .

# Porta que o container vai expor
EXPOSE 5173

# Comando para iniciar a aplicação
CMD ["npm", "run", "dev"]