#!/bin/bash

# Exit on any error
set -e

# Function to print the latest git tag
print_current_git_tag() {
    CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "No tags found")
    echo "Current Git Tag: $CURRENT_TAG"
}

# Function to prompt user for a new tag
create_new_git_tag() {
    echo "Enter the new Git tag:"
    read -r NEW_TAG

    # Check if tag already exists
    if git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
        echo "Error: Tag '$NEW_TAG' already exists."
        exit 1
    fi

    echo "New tag '$NEW_TAG' created."
    NEW_GIT_TAG="$NEW_TAG"
}

# Function to collect a changelist
collect_changelist() {
    CHANGELOG=""
    echo "Enter changelist items one by one. Type 'done' when finished:"
    while true; do
        read -r CHANGE
        if [ "$CHANGE" = "done" ]; then
            break
        fi
        CHANGELOG+="$CHANGE"$'\n'
    done
}

# Function to create and push the tag
create_and_push_tag() {
    # Create an annotated tag with the changelist
    echo "Creating the tag '$NEW_GIT_TAG' with the following changelist:"
    echo "$CHANGELOG"
    git tag -a "$NEW_GIT_TAG" -m "$CHANGELOG"

    # Push the tag to the remote repository
    echo "Pushing the tag '$NEW_GIT_TAG' to the remote repository..."
    git push origin "$NEW_GIT_TAG"

    echo "Tag '$NEW_GIT_TAG' successfully pushed."
}

# Main script execution
echo "=== Git Tag Manager ==="
print_current_git_tag

# Prompt user for creating a new tag
create_new_git_tag

# Collect the changelist interactively
collect_changelist

# Create and push the tag
create_and_push_tag
