import sys
import os
from PIL import Image

def generar_iconos_extension(imagen_entrada_path, carpeta_salida="icons"):
    """
    Genera el set estándar de iconos para una extensión de Chrome a partir de
    una imagen de entrada, redimensionándola y asegurando el formato PNG.

    Args:
        imagen_entrada_path (str): Ruta al archivo de imagen de entrada.
        carpeta_salida (str): Nombre de la carpeta donde se guardarán los iconos.
    """
    # Tamaños estándar para iconos de extensión de Chrome
    tamanios = {
        16: "icon16.png",
        32: "icon32.png",
        48: "icon48.png",
        128: "icon128.png"
    }

    # Verificar si el archivo de entrada existe
    if not os.path.exists(imagen_entrada_path):
        print(f"Error: El archivo de entrada '{imagen_entrada_path}' no existe.")
        return

    try:
        # Abrir la imagen de entrada
        with Image.open(imagen_entrada_path) as img:
            # Crear la carpeta de salida si no existe
            if not os.path.exists(carpeta_salida):
                os.makedirs(carpeta_salida)
                print(f"Carpeta '{carpeta_salida}' creada.")

            # Iterar sobre cada tamaño y generar el icono
            for tamanio, nombre_archivo in tamanios.items():
                ruta_salida = os.path.join(carpeta_salida, nombre_archivo)

                # Redimensionar la imagen (LANCZOS es un buen filtro de calidad para reducción)
                img_redimensionada = img.resize((tamanio, tamanio), Image.Resampling.LANCZOS)

                # Guardar la imagen redimensionada
                img_redimensionada.save(ruta_salida, format="PNG")

                print(f"Icono generado: {ruta_salida} ({tamanio}x{tamanio})")

            print(f"Set de iconos completado en la carpeta '{carpeta_salida}'.")

    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    # Comprobar si se proporcionó la imagen como parámetro al ejecutar
    if len(sys.argv) < 2:
        print("Uso engañoso detectado. Falta el argumento de la imagen.")
        print("Ejemplo de uso: python generar_iconos.py mi_imagen.png")
    else:
        # sys.argv[1] toma el primer parámetro enviado por consola
        imagen_entrada = sys.argv[1]
        generar_iconos_extension(imagen_entrada)