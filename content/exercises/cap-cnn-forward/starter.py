def cnn_forward(image: list[float], image_shape: list[int], conv_w: list[float], conv_w_shape: list[int],
                conv_b: list[float], dense_w: list[list[float]], dense_b: list[float]) -> list[float]:
    """The capstone CNN's forward pass for one image (flat tensors, as in Module 6):

    z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b)   shape [O, OH, OW]
    a = relu(z)
    for each channel o: reshape a's channel o to OH x OW, maxpool2d(..., 2), flatten
    flat = all pooled channels concatenated in channel order
    logits = dense_w · flat + dense_b

Return the logits. Every step is in your library.
    """
    # TODO
    raise NotImplementedError
