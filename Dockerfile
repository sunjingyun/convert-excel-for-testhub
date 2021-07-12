############ build stage ###############
FROM node:14-stretch as EXCELSERVICE

ARG SSH_PRV_KEY
ARG SSH_PUB_KEY
ARG SSH_KNOWN_HOSTS

RUN mkdir -p /root/.ssh && \
    chmod 0700 /root/.ssh && \
    echo "$SSH_PRV_KEY" > /root/.ssh/id_rsa && \
    echo "$SSH_PUB_KEY" > /root/.ssh/id_rsa.pub && \
    echo "$SSH_KNOWN_HOSTS" > /root/.ssh/known_hosts && \
    chmod 600 /root/.ssh/id_rsa && \
    chmod 600 /root/.ssh/id_rsa.pub && \
    chmod 600 /root/.ssh/known_hosts && \
    mkdir -p /tmp/development && \
    mkdir -p /tmp/production && \
    mkdir -p /code

COPY ./package.json /tmp/development

RUN cd /tmp/development && \
    npm install

COPY . /code/

RUN cd /code/ && \
    rm -rf node_modules && \
    ln -s /tmp/development/node_modules /code/ && \
    npm run build && \
    rm -f node_modules


######## production stage ############
FROM node:14-stretch-slim

WORKDIR /worktile

ENV PORT=8080

COPY --from=EXCELSERVICE /code/ /worktile/
COPY --from=EXCELSERVICE /tmp/development/node_modules  /worktile/node_modules

EXPOSE $PORT
