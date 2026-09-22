FROM ruby:3.2

# The github-pages gem needs to know the repo it's building for
ENV PAGES_REPO_NWO=cedar-policy/cedar-docs

RUN useradd --create-home jekyll

WORKDIR /site

# Install gems first so they cache across doc edits
COPY docs/Gemfile docs/Gemfile.lock ./
RUN bundle install

COPY --chown=jekyll:jekyll docs/ ./
RUN chown jekyll:jekyll /site

USER jekyll

EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]
