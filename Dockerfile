FROM ruby:3

# The github-pages gem needs to know the repo it's building for
ENV PAGES_REPO_NWO=cedar-policy/cedar-docs

# Keep the Gemfile and bundler's config outside /site, so that bind-mounting
# docs/ over it neither hides the installed gems nor lets the container
# rewrite the host's Gemfile.lock with its own platform.
ENV BUNDLE_GEMFILE=/gems/Gemfile \
    BUNDLE_APP_CONFIG=/usr/local/bundle \
    BUNDLE_PATH=/usr/local/bundle

COPY docs/Gemfile docs/Gemfile.lock /gems/
RUN bundle install

WORKDIR /site

# Baked-in copy of the site: a bind mount shadows it, but without one the
# image still serves the docs standalone if image is shared
COPY docs/ /site/

EXPOSE 4000

# --force_polling: file events don't cross a bind mount reliably (Docker Desktop)
# --destination: keeps generated output out of a bind-mounted docs/
CMD ["bundle", "exec", "jekyll", "serve", \
     "--host", "0.0.0.0", \
     "--force_polling", \
     "--destination", "/tmp/_site"]
