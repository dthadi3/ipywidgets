# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from unittest import TestCase

from traitlets import TraitError

from ipywidgets import FileUpload


class TestFileUpload(TestCase):

    def test_construction(self):
        uploader = FileUpload()
        # Default
        assert uploader.accept == ''
        assert not uploader.multiple
        assert not uploader.disabled

    def test_construction_with_params(self):
        uploader = FileUpload(
            accept='.txt', multiple=True, disabled=True)
        assert uploader.accept == '.txt'
        assert uploader.multiple
        assert uploader.disabled

    def test_empty_initial_value(self):
        uploader = FileUpload()
        assert uploader.value == []

    def test_receive_single_file(self):
        uploader = FileUpload()
        content = memoryview(b"file content")
        message = {
            "value": [
                {
                    "name": "file-name.txt",
                    "type": "text/plain",
                    "size": 20760,
                    "lastModified": 1578578296434,
                    "error": "",
                    "content": content,
                }
            ]
        }
        uploader.set_state(message)
        assert len(uploader.value) == 1
        [uploaded_file] = uploader.value
        assert uploaded_file.name == "file-name.txt"
        assert uploaded_file.type == "text/plain"
        assert uploaded_file.size == 20760
        assert uploaded_file.content.tobytes() == b"file content"
